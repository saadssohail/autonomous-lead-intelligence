import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getLLMInteractions, clearLLMInteractions } from '@/lib/llm-provider';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * POST /api/analyze/execute
 * Internal endpoint — runs the heavy pipeline for a given runId.
 * Called via self-invocation from POST /api/analyze.
 */
export async function POST(request: NextRequest) {
  let runId: string | undefined;

  try {
    const body = await request.json();
    runId = body.runId;
    const { companyName, companyDomain, useLiveData } = body;

    if (!runId) {
      return NextResponse.json({ error: 'Missing runId' }, { status: 400 });
    }

    console.log(`[execute] Starting pipeline for run ${runId}: ${companyName}`);

    // Mark as running
    await prisma.run.update({
      where: { id: runId },
      data: { status: 'running' },
    });

    // Clear previous in-memory interactions before this pipeline run
    clearLLMInteractions();

    // Dynamic import to isolate module-level crashes
    const { runAnalysisPipeline } = await import('@/lib/pipeline');

    const result = await runAnalysisPipeline(
      companyName,
      companyDomain || `${companyName.toLowerCase().replace(/\s+/g, '')}.com`,
      useLiveData ?? false
    );

    // Find or create company
    let dbCompany = await prisma.company.findUnique({
      where: { domain: result.brief.snapshot.domain },
    });

    if (!dbCompany) {
      dbCompany = await prisma.company.create({
        data: {
          name: result.brief.snapshot.name,
          domain: result.brief.snapshot.domain,
          country: result.brief.snapshot.country,
          industry: result.brief.snapshot.industry,
          sourcesUsed: JSON.stringify(['website', 'feedback', 'seed']),
        },
      });
    }

    // Create brief
    const brief = await prisma.brief.create({
      data: {
        companyId: dbCompany.id,
        score: result.brief.score.total,
        scoreRationale: JSON.stringify({
          rationale: result.brief.score.rationale,
          breakdown: result.brief.score.breakdown,
        }),
        snapshot: JSON.stringify(result.brief.snapshot),
        signals: JSON.stringify(result.brief.signals),
        painThemes: JSON.stringify(result.brief.painThemes),
        reasoningChains: JSON.stringify(result.brief.reasoningChains),
        whyNow: result.brief.whyNow,
        whyAlfabolt: result.brief.whyAlfabolt,
        outreachAngle: result.brief.outreachAngle,
        openingMessage: result.brief.openingMessage,
      },
    });

    // Update run → completed (store pipeline logs + LLM interactions)
    const llmInteractions = getLLMInteractions();
    await prisma.run.update({
      where: { id: runId },
      data: {
        status: 'completed',
        logs: JSON.stringify({
          steps: result.logs,
          llmInteractions: llmInteractions.map(i => ({
            timestamp: i.timestamp,
            operation: i.operation,
            request: { prompt: i.request.prompt.slice(0, 500), model: i.request.model, temperature: i.request.temperature },
            response: { content: i.response.content.slice(0, 1000), parsed: undefined },
            duration: i.duration,
            error: i.error,
          })),
        }),
        finishedAt: new Date(),
      },
    });

    console.log(`[execute] Pipeline completed for run ${runId}, brief ${brief.id}`);

    return NextResponse.json({ success: true, briefId: brief.id });
  } catch (error) {
    console.error(`[execute] Pipeline failed for run ${runId}:`, error);

    // Update run → failed
    if (runId) {
      try {
        await prisma.run.update({
          where: { id: runId },
          data: {
            status: 'failed',
            logs: JSON.stringify([
              {
                step: 'pipeline_error',
                status: 'failed',
                timestamp: new Date(),
                details: error instanceof Error ? error.message : String(error),
              },
            ]),
            finishedAt: new Date(),
          },
        });
      } catch (dbError) {
        console.error('[execute] Failed to update run status:', dbError);
      }
    }

    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Pipeline failed' },
      { status: 500 }
    );
  }
}
