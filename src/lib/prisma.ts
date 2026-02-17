import { PrismaClient } from '@prisma/client'

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

let _prisma: PrismaClient | undefined

function getPrismaClient(): PrismaClient {
  if (_prisma) return _prisma
  
  // Check global cache in development
  if (global.prisma) {
    _prisma = global.prisma
    return _prisma
  }

  // Lazy initialization - only happens when prisma is first accessed
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('Missing DATABASE_URL at runtime')
  }
  
  _prisma = new PrismaClient({ datasources: { db: { url } } })
  
  if (process.env.NODE_ENV !== 'production') {
    global.prisma = _prisma
  }
  
  return _prisma
}

// Use Proxy for transparent lazy initialization
export const prisma = new Proxy({} as PrismaClient, {
  get: (target, prop) => {
    const client = getPrismaClient()
    const value = Reflect.get(client, prop)
    return typeof value === 'function' ? value.bind(client) : value
  }
})
