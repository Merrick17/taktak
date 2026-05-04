import { NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"
import prisma from "@/lib/prisma"
import { requireAdminResponse } from "@/lib/require-admin"
import { getServerSession } from "@/lib/session"
import { replaceProductImages } from "@/lib/product-images"
import {
  productIncludeForApi,
  serializeAppProduct,
  validatePublishedHasImages,
  type ProductImageInput,
} from "@/lib/product-serialize"

function normalizeImages(raw: unknown): ProductImageInput[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((x): x is { url: string; alt?: string | null } => Boolean(x) && typeof (x as { url?: string }).url === "string")
    .map((x) => ({
      url: String(x.url).trim(),
      alt: x.alt != null ? String(x.alt) : undefined,
    }))
    .filter((x) => x.url.length > 0)
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession()
    const isAdmin = session?.role === "admin"

    const { searchParams } = new URL(req.url)
    const limitRaw = searchParams.get("limit")
    const pageRaw = searchParams.get("page")
    const limit = limitRaw ? Math.min(100, Math.max(1, parseInt(limitRaw, 10) || 24)) : 24
    const page = pageRaw ? Math.max(1, parseInt(pageRaw, 10) || 1) : 1
    const skip = (page - 1) * limit

    const statusParam = searchParams.get("status") ?? ""
    const dateFrom = searchParams.get("dateFrom") ?? ""
    const dateTo = searchParams.get("dateTo") ?? ""
    const qRaw = searchParams.get("q") ?? ""
    const q = qRaw.trim()

    const baseWhere: Prisma.ProductWhereInput = {
      ...(!isAdmin ? { status: "published" } : {}),
      ...(isAdmin && statusParam && statusParam !== "all" ? { status: statusParam } : {}),
      ...(dateFrom || dateTo
        ? {
            createdAt: {
              ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
              ...(dateTo ? { lte: new Date(dateTo) } : {}),
            },
          }
        : {}),
    }

    const where: Prisma.ProductWhereInput =
      q.length > 0
        ? {
            AND: [
              baseWhere,
              {
                OR: [
                  { title: { contains: q, mode: "insensitive" } },
                  { handle: { contains: q, mode: "insensitive" } },
                ],
              },
            ],
          }
        : baseWhere

    const [products, total] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        include: productIncludeForApi,
        orderBy: [{ adsBoosted: "desc" }, { createdAt: "desc" }],
        take: limit,
        skip,
      }),
      prisma.product.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)
    return NextResponse.json({
      products: products.map(serializeAppProduct),
      total,
      page,
      totalPages,
      limit,
    })
  } catch {
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const denied = await requireAdminResponse()
    if (denied) return denied

    const body = await req.json()
    const {
      title,
      description,
      handle,
      status = "published",
      adsBoosted: rawAdsBoosted,
      categories = [],
      categoryIds: rawCategoryIds,
      variants = [],
      images: rawImages,
    } = body

    const images = normalizeImages(rawImages)
    const err = validatePublishedHasImages(String(status), images)
    if (err) return NextResponse.json({ error: err }, { status: 400 })

    const adsBoosted = rawAdsBoosted === true || rawAdsBoosted === "true"

    const data: Prisma.ProductCreateInput = {
      title: String(title ?? ""),
      description: description != null ? String(description) : null,
      handle: String(handle ?? ""),
      status: String(status),
      adsBoosted,
    }

    if (Array.isArray(rawCategoryIds) && rawCategoryIds.length > 0) {
      data.categories = {
        connect: rawCategoryIds.map((cid: unknown) => ({ id: String(cid) })),
      }
    } else if (Array.isArray(categories) && categories.length > 0) {
      data.categories = {
        create: categories.map((cat: { name: string; handle: string }) => ({
          name: String(cat.name),
          handle: String(cat.handle),
        })),
      }
    }

    if (Array.isArray(variants) && variants.length > 0) {
      data.variants = {
        create: variants.map(
          (v: {
            title?: string
            sku: string
            price: number | string
            inventory?: number
            options?: { name: string; value: string }[]
          }) => ({
            title: v.title ?? null,
            sku: String(v.sku),
            price: v.price,
            inventory: v.inventory ?? 0,
            options: {
              create: (Array.isArray(v.options) ? v.options : []).map((o: { name: string; value: string }) => ({
                name: String(o.name),
                value: String(o.value),
              })),
            },
          })
        ),
      }
    }

    const created = await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({ data })
      await replaceProductImages(tx, product.id, images)
      return tx.product.findUniqueOrThrow({
        where: { id: product.id },
        include: productIncludeForApi,
      })
    })

    return NextResponse.json(serializeAppProduct(created))
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 })
  }
}
