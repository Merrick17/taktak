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

/** Public GET: resolve by product id first, then by handle (slug). */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession()
    const isAdmin = session?.role === "admin"

    const { id: slug } = await params
    let product = await prisma.product.findUnique({
      where: { id: slug },
      include: productIncludeForApi,
    })
    if (!product) {
      product = await prisma.product.findUnique({
        where: { handle: slug },
        include: productIncludeForApi,
      })
    }
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }
    if (product.status !== "published" && !isAdmin) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }
    return NextResponse.json(serializeAppProduct(product))
  } catch {
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const denied = await requireAdminResponse()
    if (denied) return denied

    const { id } = await params
    const body = await req.json()
    const {
      title,
      description,
      handle,
      status,
      adsBoosted: rawAdsBoosted,
      images: rawImages,
      variants: rawVariants,
      categoryIds: rawCategoryIds,
    } = body

    const existing = await prisma.product.findUnique({
      where: { id },
      include: { images: { orderBy: { sortOrder: "asc" } }, variants: { include: { options: true } } },
    })
    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    const nextStatus = status !== undefined ? String(status) : existing.status
    const nextImages =
      rawImages !== undefined
        ? normalizeImages(rawImages)
        : existing.images.map((img) => ({ url: img.url, alt: img.alt }))

    const err = validatePublishedHasImages(nextStatus, nextImages)
    if (err) return NextResponse.json({ error: err }, { status: 400 })

    const data: Prisma.ProductUpdateInput = {}
    if (title !== undefined) data.title = String(title)
    if (description !== undefined) data.description = description === null ? null : String(description)
    if (handle !== undefined) data.handle = String(handle)
    if (status !== undefined) data.status = String(status)
    if (rawAdsBoosted !== undefined) {
      data.adsBoosted = rawAdsBoosted === true || rawAdsBoosted === "true"
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (Object.keys(data).length > 0) {
        await tx.product.update({ where: { id }, data })
      }
      if (rawImages !== undefined) {
        await replaceProductImages(tx, id, nextImages)
      }
      if (Array.isArray(rawVariants)) {
        await tx.variant.deleteMany({ where: { productId: id } })
        for (const v of rawVariants as Array<{ title?: string; sku: string; price: number | string; inventory?: number; options?: { name: string; value: string }[] }>) {
          await tx.variant.create({
            data: {
              productId: id,
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
            },
          })
        }
      }
      if (rawCategoryIds !== undefined) {
        const ids = Array.isArray(rawCategoryIds) ? rawCategoryIds.map((x: unknown) => String(x)) : []
        await tx.product.update({
          where: { id },
          data: {
            categories: { set: ids.map((cid) => ({ id: cid })) },
          },
        })
      }
      return tx.product.findUniqueOrThrow({
        where: { id },
        include: productIncludeForApi,
      })
    })

    return NextResponse.json(serializeAppProduct(updated))
  } catch {
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const denied = await requireAdminResponse()
    if (denied) return denied

    const { id } = await params
    await prisma.product.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 })
  }
}
