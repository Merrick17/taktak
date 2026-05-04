import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-zinc-50 dark:bg-zinc-900 min-h-[calc(100svh-4rem)] flex items-center">
      <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 py-16 sm:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Text Content */}
          <div className="flex flex-col">
            <p className="text-sm font-medium tracking-widest text-primary uppercase mb-4">
              مجموعة 2026 الجديدة
            </p>
            <h1 className="text-4xl font-bold tracking-tight leading-tight sm:text-5xl lg:text-6xl xl:text-7xl">
              كان تحب حليب الغول، <br /> تلقاه عندنا
            </h1>
            <p className="mt-6 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-md">
            ختيارات مدروسة، جودة تدوم، وأناقة بسيطة.
            
            </p>
       
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button size="lg" asChild>
                <Link href="/products">تسوق الآن</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/products?category=beauty">اكتشف المجموعة</Link>
              </Button>
            </div>

            <div className="mt-10 flex items-center gap-6 sm:gap-8">
              <div>
                <p className="text-2xl font-bold">+12K</p>
                <p className="text-xs text-muted-foreground">عميل سعيد</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div>
                <p className="text-2xl font-bold">4.9★</p>
                <p className="text-xs text-muted-foreground">متوسط التقييم</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div>
                <p className="text-2xl font-bold">COD</p>
                <p className="text-xs text-muted-foreground">الدفع عند الاستلام</p>
              </div>
            </div>
          </div>

          {/* Hero Illustration */}
          <div className="relative hidden lg:block">
            <div className="relative h-[520px] xl:h-[600px] w-full rounded-3xl overflow-hidden bg-gradient-to-br from-primary/5 via-muted to-secondary/5">
              <Image
                src="/assets/taktak_hero_illustration.png"
                alt="تكتك — أساسيات عصرية"
                fill
                className="object-contain object-center drop-shadow-xl"
                priority
                sizes="(max-width: 1024px) 0px, 50vw"
              />
            </div>

            {/* Floating badge */}
            <div className="absolute bottom-6 start-6 bg-background/95 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-lg border border-border/40">
              <p className="text-xs text-muted-foreground">مجموعة</p>
              <p className="font-bold text-sm">الأساسيات العصرية 2026</p>
            </div>
          </div>
        </div>
      </div>

      {/* Background decoration */}
      <div className="pointer-events-none absolute start-0 bottom-0 h-80 w-80 opacity-[0.03]" aria-hidden="true">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <path fill="currentColor" d="M47.5,-57.4C59.3,-46.2,65.4,-29.2,67.3,-12.3C69.3,4.6,67,21.4,58.2,33.1C49.4,44.8,34.1,51.4,18.2,56.1C2.3,60.8,-14.2,63.5,-28.6,58.3C-43,53.1,-55.3,40,-61.7,24.4C-68.1,8.8,-68.6,-9.3,-62.4,-24.5C-56.1,-39.7,-43.2,-51.9,-29.3,-62.3C-15.4,-72.7,-0.5,-81.3,13.1,-78.5C26.8,-75.7,35.7,-68.5,47.5,-57.4Z" transform="translate(100 100)" />
        </svg>
      </div>
    </section>
  )
}
