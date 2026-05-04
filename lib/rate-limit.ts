type Entry = { count: number; resetAt: number }

const buckets = new Map<string, Entry>()

function readIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for")
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim()
    if (first) return first
  }
  return req.headers.get("x-real-ip") ?? "unknown"
}

export function rateLimit(
  req: Request,
  keyPrefix: string,
  maxRequests: number,
  windowMs: number
): { ok: true } | { ok: false; retryAfterSeconds: number } {
  const now = Date.now()
  const ip = readIp(req)
  const key = `${keyPrefix}:${ip}`
  const current = buckets.get(key)

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true }
  }

  if (current.count >= maxRequests) {
    return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) }
  }

  current.count += 1
  buckets.set(key, current)
  return { ok: true }
}
