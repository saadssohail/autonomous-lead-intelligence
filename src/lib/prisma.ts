import { PrismaClient } from '@prisma/client'

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

function getDbUrl(): string {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('Missing DATABASE_URL at runtime')
  return url
}

function makePrisma(): PrismaClient {
  const url = getDbUrl()
  return new PrismaClient({ datasources: { db: { url } } })
}

export const prisma = global.prisma ?? makePrisma()
if (process.env.NODE_ENV !== 'production') global.prisma = prisma
