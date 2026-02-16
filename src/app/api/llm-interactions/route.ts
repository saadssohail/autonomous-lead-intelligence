import { NextRequest, NextResponse } from 'next/server';
import { getLLMInteractions } from '@/lib/llm-provider';

export async function GET(request: NextRequest) {
  try {
    const interactions = getLLMInteractions();
    
    return NextResponse.json({
      success: true,
      interactions,
      count: interactions.length,
    });
  } catch (error) {
    console.error('Failed to get LLM interactions:', error);
    return NextResponse.json(
      {
        success: false,
        interactions: [],
        count: 0,
      },
      { status: 500 }
    );
  }
}
