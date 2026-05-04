/**
 * Adds Cloudinary f_auto,q_auto transformation to a Cloudinary URL so the CDN
 * serves a web-optimised WebP/AVIF instead of the raw uploaded PNG.
 *
 * Input:  https://res.cloudinary.com/xxx/image/upload/v123/taktak/products/foo.png
 * Output: https://res.cloudinary.com/xxx/image/upload/f_auto,q_auto/v123/taktak/products/foo.png
 */
export function cloudinaryOptimize(url: string | null | undefined): string | null {
  if (!url) return null
  if (!url.includes("res.cloudinary.com")) return url
  // Avoid adding transformations twice
  if (url.includes("/upload/f_auto")) return url
  return url.replace("/upload/", "/upload/f_auto,q_auto/")
}
