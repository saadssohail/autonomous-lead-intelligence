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

  // Lazy initialization - only happens when prisma is first used
  // Use bracket notation to prevent Next.js/webpack static replacement
  const url = process.env['DATABASE_URL']
  if (!url) {
    throw new Error(
      `Missing DATABASE_URL at runtime (keys: ${Object.keys(process.env).filter(k => k.includes('DATABASE')).join(', ') || 'none'})`
    )
  }

  _prisma = new PrismaClient({ datasources: { db: { url } } })

  if (process.env.NODE_ENV !== 'production') {
    global.prisma = _prisma
  }

  return _prisma
}

// Properties accessed during module loading / Promise detection / serialization
// that must NOT trigger Prisma client initialization
const SKIP_PROPS = new Set([
  'then', 'toJSON', 'toString', 'valueOf',
  '$$typeof', 'asymmetricMatch', 'nodeType',
  Symbol.toPrimitive, Symbol.toStringTag, Symbol.iterator,
])

// Use Proxy for transparent lazy initialization
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    // Guard: skip internal/inspection property accesses that happen
    // during module loading before env vars are available
    if (typeof prop === 'symbol' || SKIP_PROPS.has(prop)) {
      return undefined
    }
    const client = getPrismaClient()
    const value = (client as any)[prop]
    return typeof value === 'function' ? value.bind(client) : value
  },
})
