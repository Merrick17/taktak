/**
 * Open Graph image URLs for social crawlers (Facebook, X, LinkedIn).
 * Cloudinary: 1200×630 JPEG crop (recommended link-preview aspect).
 */

const CLOUDINARY_HOST = "res.cloudinary.com"

/** Transformation chain inserted after `/upload/`. */
const OG_TRANSFORM = "c_fill,w_1200,h_630,g_auto,f_jpg,q_auto"

function stripLeadingAutoTransform(url: string): string {
  return url.replace(/\/upload\/f_auto,q_auto\//, "/upload/")
}

/**
 * Injects OG crop + JPEG into a Cloudinary delivery URL.
 * Leaves other absolute HTTPS URLs unchanged.
 */
export function openGraphImageUrl(
  url: string | null | undefined,
  options?: { baseUrl?: string }
): string | undefined {
  if (!url?.trim()) return undefined
  const u = stripLeadingAutoTransform(url.trim())
  const base = options?.baseUrl?.replace(/\/$/, "") ?? ""

  if (u.startsWith("http")) {
    if (!u.includes(CLOUDINARY_HOST) || !u.includes("/upload/")) return u
    if (u.includes("w_1200") && u.includes("h_630") && u.includes("c_fill")) return u
    return u.replace("/upload/", `/upload/${OG_TRANSFORM}/`)
  }

  if (!base) return undefined
  const path = u.startsWith("/") ? u : `/${u}`
  return new URL(path, `${base}/`).href
}

/** Absolute URL for the default site image used when a page has no hero/product image. */
export function defaultOgImageAbsolute(baseUrl: string): string {
  const base = baseUrl.replace(/\/$/, "")
  return new URL("/assets/taktak_logo.png", `${base}/`).href
}
