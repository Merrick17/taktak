import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  pgPool: pg.Pool | undefined
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set")
  }
  // Keep pool small: Supabase shared limits apply ("Max client connections reached" when exhausted).
  const max = Math.min(20, Math.max(1, Number(process.env.PG_POOL_MAX) || 5))
  const pool =
    globalForPrisma.pgPool ??
    new pg.Pool({
      connectionString,
      max,
      idleTimeoutMillis: 20_000,
      connectionTimeoutMillis: 15_000,
    })
  if (process.env.NODE_ENV !== "production") globalForPrisma.pgPool = pool
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

const prisma = globalForPrisma.prisma ?? createPrismaClient()

export default prisma

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
