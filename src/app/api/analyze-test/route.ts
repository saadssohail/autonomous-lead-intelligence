import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Lightweight diagnostic endpoint to verify:
 * 1. POST requests work
 * 2. Request body parsing works
 * 3. Prisma connects and can write/read
 * 4. Pipeline module can be imported
 * 
 * Usage:
 *   POST /api/analyze-test
 *   Body: { "company": { "name": "Test" } }
 */
export async function POST(request: NextRequest) {
  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    envCheck: {
      DATABASE_URL: Boolean(process.env.DATABASE_URL),
      DATABASE_URL_length: (process.env.DATABASE_URL ?? '').length,
      OPENAI_API_KEY: Boolean(process.env.OPENAI_API_KEY),
      DEMO_MODE: process.env.DEMO_MODE ?? 'unset',
    },
  };

  // Step 1: Parse request body
  try {
    const body = await request.json();
    results.bodyParsed = true;
    results.body = body;
  } catch (e) {
    results.bodyParsed = false;
    results.bodyError = String(e);
    return NextResponse.json(results, { status: 400 });
  }

  // Step 2: Test Prisma connection
  try {
    const count = await prisma.company.count();
    results.prismaConnected = true;
    results.companyCount = count;
  } catch (e) {
    results.prismaConnected = false;
    results.prismaError = e instanceof Error ? e.message : String(e);
    return NextResponse.json(results, { status: 500 });
  }

  // Step 3: Test Prisma write (Run table)
  try {
    const run = await prisma.run.create({
      data: {
        input: JSON.stringify({ test: true }),
        status: 'test',
        logs: JSON.stringify([]),
        startedAt: new Date(),
        finishedAt: new Date(),
      },
    });
    results.prismaWriteOk = true;
    results.testRunId = run.id;

    // Clean up
    await prisma.run.delete({ where: { id: run.id } });
    results.prismaDeleteOk = true;
  } catch (e) {
    results.prismaWriteOk = false;
    results.prismaWriteError = e instanceof Error ? e.message : String(e);
    return NextResponse.json(results, { status: 500 });
  }

  // Step 4: Test pipeline import (dynamic to isolate crash)
  try {
    const { runAnalysisPipeline } = await import('@/lib/pipeline');
    results.pipelineImportOk = true;
    results.pipelineType = typeof runAnalysisPipeline;
  } catch (e) {
    results.pipelineImportOk = false;
    results.pipelineImportError = e instanceof Error ? e.message : String(e);
  }

  results.allPassed = results.bodyParsed && results.prismaConnected && results.prismaWriteOk && results.pipelineImportOk;

  return NextResponse.json(results);
}

export async function GET() {
  return NextResponse.json({
    info: 'POST a JSON body like: { "company": { "name": "Test" } }',
  });
}
