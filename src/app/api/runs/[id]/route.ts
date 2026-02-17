import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/runs/:id
 * Poll for run status. Returns run + brief when complete.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const run = await prisma.run.findUnique({
      where: { id: params.id },
    });

    if (!run) {
      return NextResponse.json(
        { success: false, error: 'Run not found' },
        { status: 404 }
      );
    }

    const response: Record<string, any> = {
      success: true,
      run: {
        id: run.id,
        status: run.status,
        logs: JSON.parse(run.logs || '[]'),
        startedAt: run.startedAt,
        finishedAt: run.finishedAt,
      },
    };

    // If completed, fetch the brief + company
    if (run.status === 'completed') {
      const input = JSON.parse(run.input || '{}');
      const companyName = input.company?.name || '';
      const companyDomain = input.company?.domain || '';

      // Find the most recent brief for this company
      const brief = await prisma.brief.findFirst({
        where: {
          company: {
            OR: [
              ...(companyDomain ? [{ domain: companyDomain }] : []),
              ...(companyName ? [{ name: companyName }] : []),
            ],
          },
        },
        orderBy: { createdAt: 'desc' },
        include: { company: true },
      });

      if (brief) {
        // scoreRationale stores the rationale array (string[])
        const rawRationale = JSON.parse(brief.scoreRationale || '[]');
        // Handle both formats: plain array or full score object
        const rationale = Array.isArray(rawRationale) ? rawRationale : (rawRationale.rationale || []);
        const breakdown = Array.isArray(rawRationale) ? {} : (rawRationale.breakdown || {});
        response.brief = {
          id: brief.id,
          companyId: brief.companyId,
          score: {
            total: brief.score,
            breakdown,
            rationale,
          },
          snapshot: JSON.parse(brief.snapshot || '{}'),
          signals: JSON.parse(brief.signals || '[]'),
          painThemes: JSON.parse(brief.painThemes || '[]'),
          reasoningChains: JSON.parse(brief.reasoningChains || '[]'),
          whyNow: brief.whyNow,
          whyAlfabolt: brief.whyAlfabolt,
          capabilityMatches: [],
          outreachAngle: brief.outreachAngle,
          openingMessage: brief.openingMessage,
          createdAt: brief.createdAt,
        };
        response.run.briefId = brief.id;
      }
    }

    // If failed, include error from logs
    if (run.status === 'failed') {
      const logs = JSON.parse(run.logs || '[]');
      const errorLog = logs.find((l: any) => l.status === 'failed');
      if (errorLog) {
        response.run.error = errorLog.details || 'Pipeline failed';
      }
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('[runs/:id] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}
