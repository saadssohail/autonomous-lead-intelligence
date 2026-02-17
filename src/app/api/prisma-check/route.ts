import { prisma } from '@/lib/prisma';

export async function GET(): Promise<Response> {
  const url = (prisma as any)._engineConfig?.datasources?.db?.url
  return Response.json({
    hasProcessEnv: Boolean(process.env.DATABASE_URL),
    prismaDatasourceUrlPresent: Boolean(url),
    prismaDatasourceUrlPrefix: typeof url === 'string' ? url.slice(0, 18) : null, // "postgresql://..."
  })
}
