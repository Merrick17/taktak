import type { Prisma } from "@prisma/client"
import type { AppProduct } from "@/lib/types"

/** Standard include for API serialization (list + detail). */
export const productIncludeForApi = {
  categories: true,
  images: { orderBy: { sortOrder: "asc" as const } },
  variants: { include: { options: true } },
} satisfies Prisma.ProductInclude

type ProductWithRelations = Prisma.ProductGetPayload<{ include: typeof productIncludeForApi }>

function mapVariant(v: { id: string; productId: string; title: string | null; sku: string; price: unknown; inventory: number; options?: unknown[] }) {
  return {
    id: v.id,
    productId: v.productId,
    title: v.title,
    sku: v.sku,
    price: Number(v.price),
    inventory: v.inventory,
    options: (v.options as { id: string; variantId: string; name: string; value: string; createdAt: Date; updatedAt: Date }[] | undefined)?.map((o) => ({
      id: o.id,
      variantId: o.variantId,
      name: o.name,
      value: o.value,
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
    })) ?? [],
  }
}

function mapImages(images: { url: string; alt: string | null; sortOrder: number }[]) {
  const sorted = [...images].sort((a, b) => a.sortOrder - b.sortOrder)
  return sorted
    .filter((img) => !!img.url)
    .map((img) => ({ url: img.url, alt: img.alt ?? undefined }))
}

/** JSON-safe product for storefront / admin (decimals as numbers, ISO dates, images + thumbnail). */
export function serializeAppProduct(product: ProductWithRelations): AppProduct {
  const images = mapImages(product.images ?? [])
  const thumbnail = images[0]?.url ?? null
  return {
    id: product.id,
    title: product.title,
    description: product.description,
    handle: product.handle,
    status: product.status,
    adsBoosted: product.adsBoosted,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
    categories: product.categories.map((c) => ({
      id: c.id,
      name: c.name,
      handle: c.handle,
      image: c.image ?? null,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    })),
    variants: product.variants.map((v) => mapVariant(v)),
    thumbnail,
    images,
  }
}

export const serializeAppProductList = serializeAppProduct

export type ProductImageInput = { url: string; alt?: string | null }

export function validatePublishedHasImages(status: string, images: ProductImageInput[]) {
  if (status === "published" && images.length < 1) {
    return "Published products must have at least one image"
  }
  return null
}
