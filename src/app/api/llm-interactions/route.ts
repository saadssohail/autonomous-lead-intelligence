import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/llm-interactions?runId=xxx
 * Returns LLM interactions stored in the Run record.
 * If no runId, returns interactions from the most recent completed run.
 */
export async function GET(request: NextRequest) {
  try {
    const runId = request.nextUrl.searchParams.get('runId');

    let run;
    if (runId) {
      run = await prisma.run.findUnique({ where: { id: runId } });
    } else {
      // Fall back to the most recent completed run
      run = await prisma.run.findFirst({
        where: { status: 'completed' },
        orderBy: { finishedAt: 'desc' },
      });
    }

    if (!run) {
      return NextResponse.json({ success: true, interactions: [], count: 0 });
    }

    const rawLogs = JSON.parse(run.logs || '[]');
    const interactions = Array.isArray(rawLogs) ? [] : (rawLogs.llmInteractions || []);

    return NextResponse.json({
      success: true,
      interactions,
      count: interactions.length,
      runId: run.id,
    });
  } catch (error) {
    console.error('Failed to get LLM interactions:', error);
    return NextResponse.json(
      { success: false, interactions: [], count: 0 },
      { status: 500 }
    );
  }
}
