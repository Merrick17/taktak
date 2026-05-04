/* Quick Prisma + Supabase connectivity check (same adapter as lib/prisma.ts). Run:
 *   node --env-file=.env.local scripts/db-smoke.cjs
 */
const pg = require("pg")
const { PrismaPg } = require("@prisma/adapter-pg")
const { PrismaClient } = require("@prisma/client")

async function main() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.error("FAIL: DATABASE_URL is not set (load .env.local with --env-file)")
    process.exit(1)
  }
  const pool = new pg.Pool({ connectionString })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })
  try {
    await prisma.$queryRaw`SELECT 1`
    const n = await prisma.category.count()
    console.log("OK: SELECT 1 + category.count =", n)
  } catch (e) {
    console.error("FAIL:", e instanceof Error ? e.message : e)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
    await pool.end()
  }
}

main()
