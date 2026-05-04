/** Build a URL-safe product handle from Latin text; falls back if the title is non-Latin. */
export function slugifyHandleFromTitle(title: string): string {
  const raw = title.trim()
  if (!raw) return `product-${Date.now().toString(36)}`

  const ascii = raw
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s-]/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")

  if (ascii.length >= 2) return ascii
  return `product-${Date.now().toString(36)}`
}

/** Short label for display (filename) from a URL or path. */
export function shortImageLabel(url: string): string {
  try {
    const u = url.trim()
    const noQuery = u.split("?")[0] ?? u
    const last = noQuery.split("/").filter(Boolean).pop()
    return last && last.length > 0 ? decodeURIComponent(last) : u.slice(0, 48)
  } catch {
    return url.slice(0, 48)
  }
}
