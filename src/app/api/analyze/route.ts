import { NextRequest, NextResponse } from 'next/server';
import { AnalyzeRequestSchema, type AnalyzeResponse, type AnalysisRun } from '@/types';
import prisma from '@/lib/prisma';
import { runAnalysisPipeline } from '@/lib/pipeline';

export const maxDuration = 60; // Max 60 seconds for Vercel

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = AnalyzeRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request: ' + validation.error.message,
        } as AnalyzeResponse,
        { status: 400 }
      );
    }

    const { company, options } = validation.data;
    const companyName = company.name || '';
    const companyDomain = company.domain || '';
    
    if (!companyName && !companyDomain) {
      return NextResponse.json(
        {
          success: false,
          error: 'Either company name or domain must be provided',
        } as AnalyzeResponse,
        { status: 400 }
      );
    }

    // Create run record
    const run = await prisma.run.create({
      data: {
        input: JSON.stringify({ company, options }),
        status: 'running',
        logs: JSON.stringify([]),
        startedAt: new Date(),
      },
    });

    try {
      // Run the pipeline
      const useLiveData = options?.useLiveData ?? false;
      const result = await runAnalysisPipeline(
        companyName,
        companyDomain || `${companyName.toLowerCase().replace(/\s+/g, '')}.com`,
        useLiveData
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
          scoreRationale: JSON.stringify(result.brief.score.rationale),
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

      // Update run
      await prisma.run.update({
        where: { id: run.id },
        data: {
          status: 'completed',
          logs: JSON.stringify(result.logs),
          finishedAt: new Date(),
        },
      });

      // Return full brief with all data
      const responseBrief = {
        ...result.brief,
        id: brief.id,
        companyId: dbCompany.id,
      };

      const analysisRun: AnalysisRun = {
        id: run.id,
        input: validation.data,
        status: 'completed',
        logs: result.logs,
        startedAt: run.startedAt,
        finishedAt: new Date(),
        briefId: brief.id,
      };

      return NextResponse.json({
        success: true,
        brief: responseBrief,
        run: analysisRun,
      } as AnalyzeResponse);
    } catch (error) {
      // Update run with error
      await prisma.run.update({
        where: { id: run.id },
        data: {
          status: 'failed',
          logs: JSON.stringify([
            {
              step: 'pipeline_error',
              status: 'failed',
              timestamp: new Date(),
              details: String(error),
            },
          ]),
          finishedAt: new Date(),
        },
      });

      throw error;
    }
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      } as AnalyzeResponse,
      { status: 500 }
    );
  }
}
