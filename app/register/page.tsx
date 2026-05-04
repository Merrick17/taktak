import { Suspense } from "react"
import Link from "next/link"
import { AuthForm } from "@/components/blocks/account/auth-form"
import { Skeleton } from "@/components/ui/skeleton"

export default function RegisterPage() {
  return (
    <div className="flex flex-1 min-h-[calc(100svh-4rem)]">
      {/* Left panel — decorative brand side */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col justify-between p-12 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-[0.1]" aria-hidden="true">
          <svg className="w-full h-full" viewBox="0 0 400 600" fill="none">
            <circle cx="350" cy="100" r="300" fill="white" />
            <circle cx="50" cy="500" r="200" fill="white" />
          </svg>
        </div>
        <Link href="/" className="text-primary-foreground text-xl font-bold tracking-tight relative z-10">
          تكتك
        </Link>
        <div className="relative z-10">
          <p className="text-primary-foreground/90 text-3xl font-bold leading-snug mb-4">
            انضم إلى مجتمع<br />الأناقة العصرية
          </p>
          <div className="flex flex-col gap-2">
            {["شحن مجاني على جميع الطلبات", "خصم 20% على طلبك الأول", "وصول حصري للمجموعات الجديدة"].map((perk) => (
              <div key={perk} className="flex items-center gap-2 text-primary-foreground/80 text-sm">
                <svg className="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12l5 5L20 7" />
                </svg>
                {perk}
              </div>
            ))}
          </div>
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-10 w-full rounded-lg" />
                  </div>
                  <div className="space-y-1.5">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-10 w-full rounded-lg" />
                  </div>
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
            <AuthForm mode="register" />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
