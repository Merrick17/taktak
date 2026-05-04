import prisma from "@/lib/prisma"

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100
}

/** Same source as `recomputeAndPersistCart` — admin setting `shipping_fee`. */
export async function getShippingFeeFromSettings(): Promise<number> {
  const row = await prisma.setting.findUnique({ where: { key: "shipping_fee" } })
  return roundMoney(Math.max(0, parseFloat(row?.value ?? "0") || 0))
}
