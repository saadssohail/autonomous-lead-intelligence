import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  const hasEnv = Boolean(process.env['DATABASE_URL'])
  try {
    // Actually test the DB connection through the proxy
    const count = await prisma.company.count()
    return Response.json({
      hasProcessEnv: hasEnv,
      connected: true,
      companyCount: count,
    })
  } catch (error) {
    return Response.json({
      hasProcessEnv: hasEnv,
      connected: false,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
