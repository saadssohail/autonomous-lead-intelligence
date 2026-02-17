export async function GET(): Promise<Response> {
  return Response.json({
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    length: process.env.DATABASE_URL?.length ?? 0,
    nodeEnv: process.env.NODE_ENV ?? null,
  })
}
