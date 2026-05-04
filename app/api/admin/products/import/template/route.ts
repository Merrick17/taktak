import { NextResponse } from "next/server"
import { requireAdminResponse } from "@/lib/require-admin"

const BOM = "\uFEFF"

/** CSV template for bulk product import (UTF-8 with BOM for Excel). */
export async function GET() {
  const denied = await requireAdminResponse()
  if (denied) return denied

  const header =
    "title,handle,price,sku,inventory,status,image_url,category_handles,description\n"
  const exampleRow =
    'Example product title,example-product-handle,12.500,SKU-IMPORT-001,10,draft,,"category-slug-one;category-slug-two",Short description here\n'

  const body = BOM + header + exampleRow

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="products-import-template.csv"',
      "Cache-Control": "no-store",
    },
  })
}
