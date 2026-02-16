import { NextRequest, NextResponse } from 'next/server';
import type { GetBriefResponse, Brief } from '@/types';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const brief = await prisma.brief.findUnique({
      where: { id: params.id },
      include: {
        company: true,
      },
    });

    if (!brief) {
      return NextResponse.json(
        {
          success: false,
          error: 'Brief not found',
        } as GetBriefResponse,
        { status: 404 }
      );
    }

    const fullBrief: Brief = {
      id: brief.id,
      companyId: brief.companyId,
      score: {
        total: brief.score,
        breakdown: { painSeverity: 0, signalStrength: 0, fitScore: 0 }, // Could parse from stored data
        rationale: JSON.parse(brief.scoreRationale),
      },
      snapshot: JSON.parse(brief.snapshot),
      signals: JSON.parse(brief.signals),
      painThemes: JSON.parse(brief.painThemes),
      reasoningChains: JSON.parse(brief.reasoningChains),
      whyNow: brief.whyNow,
      whyAlfabolt: brief.whyAlfabolt,
      capabilityMatches: [],  // Could be stored separately if needed
      outreachAngle: brief.outreachAngle,
      openingMessage: brief.openingMessage,
      createdAt: brief.createdAt,
    };

    return NextResponse.json({
      success: true,
      brief: fullBrief,
    } as GetBriefResponse);
  } catch (error) {
    console.error('Get brief error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      } as GetBriefResponse,
      { status: 500 }
    );
  }
}
