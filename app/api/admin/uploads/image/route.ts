import { NextResponse } from "next/server"
import { v2 as cloudinary } from "cloudinary"
import { requireAdminResponse } from "@/lib/require-admin"
import { cloudinaryOptimize } from "@/lib/cloudinary-url"

const MAX_BYTES = 8 * 1024 * 1024
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"])

export async function POST(req: Request) {
  const denied = await requireAdminResponse()
  if (denied) return denied

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim()
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim()
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim()

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json(
      { error: "Cloudinary is not configured" },
      { status: 503 }
    )
  }

  // Configure fresh on every request to avoid stale/missing env at module load
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  })

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: "Expected multipart form data" }, { status: 400 })
  }

  const file = form.get("file")
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Missing file field" }, { status: 400 })
  }

  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: "Unsupported image type" }, { status: 400 })
  }

  const buf = Buffer.from(await file.arrayBuffer())
  if (buf.length > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 8MB)" }, { status: 400 })
  }

  try {
    const result = await new Promise<{ secure_url?: string; public_id?: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "taktak/products", resource_type: "image" },
        (err, res) => {
          if (err) reject(err)
          else resolve(res ?? {})
        }
      )
      stream.end(buf)
    })

    if (!result.secure_url) {
      return NextResponse.json({ error: "Upload failed" }, { status: 500 })
    }

    // Store the optimized URL so the DB is the source of truth
    const optimizedUrl = cloudinaryOptimize(result.secure_url) ?? result.secure_url
    return NextResponse.json({ url: optimizedUrl, publicId: result.public_id ?? null })
  } catch (e) {
    console.error("Cloudinary upload error:", e)
    return NextResponse.json({ error: "Cloudinary upload failed" }, { status: 500 })
  }
}
