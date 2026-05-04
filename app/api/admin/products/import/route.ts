import { NextResponse } from "next/server"
import { parse } from "csv-parse/sync"
import type { Prisma } from "@prisma/client"
import prisma from "@/lib/prisma"
import { requireAdminResponse } from "@/lib/require-admin"
import { replaceProductImages } from "@/lib/product-images"
import { validatePublishedHasImages, type ProductImageInput } from "@/lib/product-serialize"

const MAX_FILE_BYTES = 2 * 1024 * 1024
const MAX_ROWS = 500

export type ImportRowError = { row: number; message: string }
export type ImportRowWarning = { row: number; message: string }

function normalizeHeader(h: string): string {
  return h
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
}

function parsePrice(raw: unknown): number | null {
  if (raw === undefined || raw === null || String(raw).trim() === "") return null
  const n = Number(String(raw).replace(",", ".").trim())
  if (Number.isNaN(n) || n < 0) return null
  return n
}

function parseInventory(raw: unknown): number {
  if (raw === undefined || raw === null || String(raw).trim() === "") return 0
  const n = parseInt(String(raw).trim(), 10)
  return Number.isNaN(n) || n < 0 ? 0 : n
}

function normalizeStatus(raw: unknown): "draft" | "published" | null {
  const s = String(raw ?? "")
    .trim()
    .toLowerCase()
  if (s === "draft" || s === "مسودة") return "draft"
  if (s === "published" || s === "منشور") return "published"
  return null
}

function splitCategoryHandles(raw: unknown): string[] {
  const s = String(raw ?? "").trim()
  if (!s) return []
  return s
    .split(/[;؛,]/)
    .map((x) => x.trim())
    .filter(Boolean)
}

export async function POST(req: Request) {
  const denied = await requireAdminResponse()
  if (denied) return denied

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 })
  }

  const file = form.get("file")
  if (!file || typeof file === "string" || !("arrayBuffer" in file)) {
    return NextResponse.json({ error: "يرجى اختيار ملف CSV" }, { status: 400 })
  }

  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "الملف كبير جداً (الحد الأقصى 2 ميغابايت)" }, { status: 413 })
  }

  const buf = await file.arrayBuffer()
  let text = new TextDecoder("utf-8").decode(buf)
  if (text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1)
  }

  let records: Record<string, string>[]
  try {
    records = parse(text, {
      columns: (header: string[]) => header.map((h) => normalizeHeader(String(h))),
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
      relax_quotes: true,
    }) as Record<string, string>[]
  } catch {
    return NextResponse.json({ error: "تعذّر قراءة ملف CSV. تأكد من التنسيق." }, { status: 400 })
  }

  if (records.length > MAX_ROWS) {
    return NextResponse.json(
      { error: `عدد الصفوف كبير جداً (الحد الأقصى ${MAX_ROWS} صفاً)` },
      { status: 400 }
    )
  }

  const errors: ImportRowError[] = []
  const warnings: ImportRowWarning[] = []
  let created = 0
  let skippedEmpty = 0

  const seenHandles = new Set<string>()
  const seenSkus = new Set<string>()

  for (let i = 0; i < records.length; i++) {
    const rec = records[i]!
    const rowNumber = i + 2

    const title = String(rec.title ?? "").trim()
    const handle = String(rec.handle ?? "").trim()
    const sku = String(rec.sku ?? "").trim()
    const description = String(rec.description ?? "").trim()
    const imageUrl = String(rec.image_url ?? "").trim()
    const statusNorm = normalizeStatus(rec.status)

    const emptyRow = !title && !handle && !sku && !String(rec.price ?? "").trim()
    if (emptyRow) {
      skippedEmpty++
      continue
    }

    if (!title) {
      errors.push({ row: rowNumber, message: "عنوان المنتج مفقود." })
      continue
    }
    if (!handle) {
      errors.push({ row: rowNumber, message: "اسم الرابط (handle) مفقود." })
      continue
    }
    if (!sku) {
      errors.push({ row: rowNumber, message: "رمز المخزون (SKU) مفقود." })
      continue
    }

    const price = parsePrice(rec.price)
    if (price === null) {
      errors.push({ row: rowNumber, message: "السعر غير صالح." })
      continue
    }

    if (statusNorm === null) {
      errors.push({ row: rowNumber, message: 'الحالة يجب أن تكون "draft" أو "published" (أو مسودة / منشور).' })
      continue
    }

    const images: ProductImageInput[] = imageUrl ? [{ url: imageUrl }] : []
    const imgErr = validatePublishedHasImages(statusNorm, images)
    if (imgErr) {
      errors.push({
        row: rowNumber,
        message: "المنتجات المنشورة تحتاج رابط صورة واحد على الأقل في العمود image_url.",
      })
      continue
    }

    const hKey = handle.toLowerCase()
    const sKey = sku.toLowerCase()
    if (seenHandles.has(hKey)) {
      errors.push({ row: rowNumber, message: "اسم الرابط مكرر داخل الملف." })
      continue
    }
    if (seenSkus.has(sKey)) {
      errors.push({ row: rowNumber, message: "رمز المخزون مكرر داخل الملف." })
      continue
    }
    seenHandles.add(hKey)
    seenSkus.add(sKey)

    const existingHandle = await prisma.product.findUnique({ where: { handle } })
    if (existingHandle) {
      errors.push({ row: rowNumber, message: "يوجد منتج بنفس اسم الرابط مسبقاً." })
      continue
    }

    const existingSku = await prisma.variant.findUnique({ where: { sku } })
    if (existingSku) {
      errors.push({ row: rowNumber, message: "يوجد رمز مخزون بنفس القيمة مسبقاً." })
      continue
    }

    const categoryHandles = splitCategoryHandles(rec.category_handles)
    let categoryIds: string[] = []
    if (categoryHandles.length > 0) {
      const found = await prisma.category.findMany({
        where: { handle: { in: categoryHandles } },
        select: { id: true, handle: true },
      })
      const foundSet = new Set(found.map((c) => c.handle))
      for (const ch of categoryHandles) {
        if (!foundSet.has(ch)) {
          warnings.push({
            row: rowNumber,
            message: `تصنيف غير معروف تم تجاهله: "${ch}"`,
          })
        }
      }
      categoryIds = found.map((c) => c.id)
    }

    const inventory = parseInventory(rec.inventory)

    const data: Prisma.ProductCreateInput = {
      title,
      description: description.length > 0 ? description : null,
      handle,
      status: statusNorm,
      adsBoosted: false,
      variants: {
        create: [
          {
            sku,
            price,
            inventory,
            title: null,
            options: { create: [] },
          },
        ],
      },
    }

    if (categoryIds.length > 0) {
      data.categories = { connect: categoryIds.map((id) => ({ id })) }
    }

    try {
      await prisma.$transaction(async (tx) => {
        const product = await tx.product.create({ data })
        await replaceProductImages(tx, product.id, images)
      })
      created++
    } catch (e: unknown) {
      const code = e && typeof e === "object" && "code" in e ? String((e as { code?: string }).code) : ""
      if (code === "P2002") {
        errors.push({ row: rowNumber, message: "تعارض مع بيانات موجودة (اسم الرابط أو رمز المخزون)." })
      } else {
        errors.push({ row: rowNumber, message: "فشل إنشاء المنتج. راجع البيانات." })
      }
    }
  }

  return NextResponse.json({
    created,
    skippedEmpty,
    failed: errors.length,
    errors,
    warnings,
  })
}
