import { Suspense } from "react"
import Link from "next/link"
import { AuthForm } from "@/components/blocks/account/auth-form"
import { Skeleton } from "@/components/ui/skeleton"

export default function LoginPage() {
  return (
    <div className="flex flex-1 min-h-[calc(100svh-4rem)]">
      {/* Left panel — decorative brand side */}
      <div className="hidden lg:flex lg:w-1/2 bg-foreground flex-col justify-between p-12 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-[0.06]" aria-hidden="true">
          <svg className="w-full h-full" viewBox="0 0 400 600" fill="none">
            <circle cx="350" cy="100" r="300" fill="white" />
            <circle cx="50" cy="500" r="200" fill="white" />
          </svg>
        </div>
        <Link href="/" className="text-background text-xl font-bold tracking-tight relative z-10">
          تكتك
        </Link>
        <div className="relative z-10">
          <blockquote className="text-background/80 text-lg leading-relaxed font-light">
            &ldquo;أساسيات مختارة بعناية للحياة العصرية.&rdquo;
          </blockquote>
          <p className="mt-4 text-background/50 text-sm">جودة عالية · شحن مجاني · إرجاع سهل</p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 items-center justify-center px-6 py-16 lg:px-16">
        <div className="w-full max-w-sm">
          <div className="mb-2 lg:hidden">
            <Link href="/" className="text-lg font-bold tracking-tight">تكتك</Link>
          </div>
          <Suspense
            fallback={
              <div className="space-y-4 w-full max-w-sm mx-auto">
                <div className="space-y-1.5 mb-8">
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                </div>
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                </div>
                <Skeleton className="h-11 w-full rounded-lg" />
                <Skeleton className="h-4 w-48 mx-auto" />
              </div>
            }
          >
            <AuthForm mode="login" />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
