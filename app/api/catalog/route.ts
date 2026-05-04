import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const token =
    req.headers.get("x-catalog-token")?.trim() ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() ||
    searchParams.get("token")

  if (!token) {
    return NextResponse.json(
      { error: "Missing token. Get your catalog URL from Admin → Settings." },
      { status: 401 }
    )
  }

  const catalogTokenSetting = await prisma.setting.findUnique({ where: { key: "catalog_token" } })
  if (!catalogTokenSetting || catalogTokenSetting.value !== token) {
    return NextResponse.json({ error: "Invalid token" }, { status: 403 })
  }

  const storeNameSetting = await prisma.setting.findUnique({ where: { key: "store_name" } })
  const storeName = storeNameSetting?.value ?? "TakTak"
  const storeUrl = process.env.NEXT_PUBLIC_STORE_URL ?? "https://taktakstore.com"

  const products = await prisma.product.findMany({
    where: { status: "published" },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      variants: { include: { options: true } },
      categories: true,
    },
    orderBy: { createdAt: "desc" },
  })

  const data = products.flatMap((product: (typeof products)[number]) => {
    const imageUrl = product.images?.[0]?.url ?? ""
    const link = `${storeUrl}/products/${product.handle}`

    if (product.variants.length === 0) return []

    return product.variants.map((variant: (typeof product.variants)[number]) => {
      const price = Number(variant.price).toFixed(3)
      const inStock = (variant.inventory ?? 0) > 0

      const optionLabels =
        variant.options?.map((o: (typeof variant.options)[number]) => `${o.name}: ${o.value}`).join(" / ") ?? ""
      const itemTitle = optionLabels ? `${product.title} — ${optionLabels}` : product.title

      return {
        id: variant.id,
        title: itemTitle,
        description: product.description?.replace(/[#*`\[\]]/g, "").slice(0, 5000) ?? product.title,
        availability: inStock ? "in stock" : "out of stock",
        condition: "new",
        price: `${price} TND`,
        link,
        image_link: imageUrl,
        brand: storeName,
        google_product_category: "5192",
        item_group_id: product.id,
      }
    })
  })

  return NextResponse.json(
    { data },
    {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "private, no-store",
        Vary: "Authorization, X-Catalog-Token",
      },
    }
  )
}
