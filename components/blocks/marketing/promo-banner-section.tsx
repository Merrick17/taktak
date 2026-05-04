import Link from "next/link"
import { Button } from "@/components/ui/button"

interface Promo {
  id: string
  code: string
  value: number
  type: string
}

async function getPromos(): Promise<Promo[]> {
  try {
    const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const res = await fetch(`${base}/api/promotions/public`, {
      next: { tags: ["promotions"], revalidate: 300 },
    })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

/** Pick the single best promotion to feature: highest-percentage first, then highest-fixed. */
function pickFeatured(promos: Promo[]): Promo | null {
  if (promos.length === 0) return null
  const pct = promos.filter((p) => p.type === "percentage").sort((a, b) => b.value - a.value)
  if (pct.length) return pct[0]
  return promos.sort((a, b) => b.value - a.value)[0]
}

export async function PromoBannerSection() {
  const promos = await getPromos()
  const featured = pickFeatured(promos)

  const hasPercentage = featured?.type === "percentage"
  const hasFixed = featured?.type === "fixed"

  const headline = featured
    ? hasPercentage
      ? `خصم ${Number(featured.value).toFixed(0)}% على طلبك`
      : `وفّر ${Number(featured.value).toFixed(3)} د.ت على طلبك`
    : "تسوق أفضل المنتجات"

  const subline = featured
    ? `استخدم الكود ${featured.code} عند الدفع للحصول على خصمك.`
    : "منتجات مختارة بجودة عالية وأسعار تنافسية. الدفع عند الاستلام في كل أنحاء تونس."

  const eyebrow = featured ? "كود خصم حصري" : "متجر تكتك"

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-foreground px-8 py-16 text-background sm:px-16 sm:py-20">
          {/* decorative circles */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.06]" aria-hidden="true">
            <svg className="w-full h-full" viewBox="0 0 400 300" fill="none">
              <circle cx="350" cy="50" r="200" fill="white" />
              <circle cx="50" cy="250" r="150" fill="white" />
            </svg>
          </div>

          <div className="relative max-w-xl">
            <p className="text-xs font-medium tracking-widest text-background/60 uppercase mb-4">
              {eyebrow}
            </p>

            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {headline}
            </h2>

            {/* Promo code badge */}
            {featured && (
              <div className="mt-5 inline-flex items-center gap-3 rounded-xl border border-background/20 bg-background/10 px-4 py-2.5">
                <span className="text-xs text-background/60">كود الخصم</span>
                <span className="font-mono text-lg font-bold tracking-widest text-background">
                  {featured.code}
                </span>
                {hasPercentage && (
                  <span className="rounded-full bg-background text-foreground text-xs font-bold px-2 py-0.5">
                    -{Number(featured.value).toFixed(0)}%
                  </span>
                )}
                {hasFixed && (
                  <span className="rounded-full bg-background text-foreground text-xs font-bold px-2 py-0.5">
                    -{Number(featured.value).toFixed(3)} د.ت
                  </span>
                )}
              </div>
            )}

            <p className="mt-4 text-background/70 text-base leading-relaxed">
              {subline}
            </p>

            {/* Secondary promos */}
            {promos.length > 1 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {promos.filter((p) => p.id !== featured?.id).slice(0, 3).map((p) => (
                  <span
                    key={p.id}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-background/20 bg-background/10 px-3 py-1 text-xs text-background/80"
                  >
                    <span className="font-mono font-semibold">{p.code}</span>
                    <span className="text-background/50">·</span>
                    <span>
                      {p.type === "percentage"
                        ? `-${Number(p.value).toFixed(0)}%`
                        : `-${Number(p.value).toFixed(3)} د.ت`}
                    </span>
                  </span>
                ))}
              </div>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                size="lg"
                className="bg-background text-foreground hover:bg-background/90"
                asChild
              >
                <Link href="/products">تسوق الآن</Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-background/30 text-background hover:bg-background/10 hover:text-background"
                asChild
              >
                <Link href="/products?sort=price_asc">أقل الأسعار</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
