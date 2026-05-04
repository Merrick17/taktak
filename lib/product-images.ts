import type { Prisma } from "@prisma/client"
import type { ProductImageInput } from "@/lib/product-serialize"

export async function replaceProductImages(
  tx: Prisma.TransactionClient,
  productId: string,
  images: ProductImageInput[]
) {
  await tx.productImage.deleteMany({ where: { productId } })
  if (images.length === 0) return
  await tx.productImage.createMany({
    data: images.map((img, i) => ({
      productId,
      url: String(img.url).trim(),
      alt: img.alt != null && String(img.alt).trim() ? String(img.alt).trim() : null,
      sortOrder: i,
    })),
  })
}
