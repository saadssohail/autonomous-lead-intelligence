import { NextRequest, NextResponse } from 'next/server';
import { AnalyzeRequestSchema, type AnalyzeResponse } from '@/types';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Derive a display name from a domain string.
 * e.g. "https://10pearls.com/" → "10pearls"
 *      "payflow.example.com"   → "payflow"
 */
function deriveNameFromDomain(domain: string): string {
  try {
    let host = domain.replace(/^https?:\/\//, '').replace(/\/+$/, '');
    // Remove www.
    host = host.replace(/^www\./, '');
    // Take the first segment before the first dot
    const name = host.split('.')[0] || host;
    // Capitalise first letter
    return name.charAt(0).toUpperCase() + name.slice(1);
  } catch {
    return '';
  }
}

/**
 * POST /api/analyze  (async / job-based)
 *
 * 1. Validates input
 * 2. Creates a Run row (status = 'queued')
 * 3. Self-invokes /api/analyze/execute in a separate Lambda
 * 4. Returns { success, runId } immediately (< 2 s)
 *
 * The UI then polls GET /api/runs/:id until status is completed|failed.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = AnalyzeRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request: ' + validation.error.message } as AnalyzeResponse,
        { status: 400 }
      );
    }

    const { company, options } = validation.data;
    const companyDomain = company.domain || '';
    // Derive a display name from the domain if no name provided
    const companyName = company.name || deriveNameFromDomain(companyDomain);

    if (!companyName && !companyDomain) {
      return NextResponse.json(
        { success: false, error: 'Either company name or domain must be provided' } as AnalyzeResponse,
        { status: 400 }
      );
    }

    // Create run record (queued)
    const run = await prisma.run.create({
      data: {
        input: JSON.stringify({ company, options }),
        status: 'queued',
        logs: JSON.stringify([]),
        startedAt: new Date(),
      },
    });

    // --- Fire-and-forget: self-invoke the execute endpoint ---
    // This triggers a NEW Lambda invocation so the heavy work runs independently.
    const headersList = headers();
    const host = headersList.get('host') || headersList.get('x-forwarded-host') || '';
    const protocol = headersList.get('x-forwarded-proto') || 'https';
    const baseUrl = `${protocol}://${host}`;

    // Don't await — fire and forget
    fetch(`${baseUrl}/api/analyze/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        runId: run.id,
        companyName,
        companyDomain: companyDomain || `${companyName.toLowerCase().replace(/\s+/g, '')}.com`,
        useLiveData: options?.useLiveData ?? false,
      }),
    }).catch((err) => {
      // Log but don't block — the execute endpoint handles its own errors
      console.error('[analyze] Failed to invoke execute:', err);
    });

    // Return immediately with runId
    return NextResponse.json({
      success: true,
      runId: run.id,
      status: 'queued',
      pollUrl: `/api/runs/${run.id}`,
    });
  } catch (error) {
    console.error('[analyze] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' } as AnalyzeResponse,
      { status: 500 }
    );
  }
}
