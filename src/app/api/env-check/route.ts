export async function GET(): Promise<Response> {
  return Response.json({
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    nodeEnv: process.env.NODE_ENV ?? null,
  })
}
