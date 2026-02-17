import { NextRequest, NextResponse } from 'next/server';
import type { ListBriefsResponse, BriefSummary } from '@/types';
import { prisma } from '@/lib/prisma';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

    // Get briefs with company info
    const briefs = await prisma.brief.findMany({
      include: {
        company: {
          select: {
            name: true,
            domain: true,
          },
        },
      },
      orderBy: sortBy === 'score' ? { score: sortOrder } : { createdAt: sortOrder },
      take: limit,
      skip: offset,
    });

    const total = await prisma.brief.count();

    const summaries: BriefSummary[] = briefs.map(brief => {
      const scoreRationale = JSON.parse(brief.scoreRationale) as string[];
      
      return {
        id: brief.id,
        companyName: brief.company.name,
        companyDomain: brief.company.domain,
        score: brief.score,
        scoreRationale,
        createdAt: brief.createdAt,
      };
    });

    return NextResponse.json({
      success: true,
      briefs: summaries,
      total,
    } as ListBriefsResponse);
  } catch (error) {
    console.error('List briefs error:', error);
    return NextResponse.json(
      {
        success: false,
        briefs: [],
        total: 0,
      } as ListBriefsResponse,
      { status: 500 }
    );
  }
}
