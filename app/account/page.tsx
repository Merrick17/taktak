"use client"

import { Suspense, useEffect } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/hooks/use-auth"
import { AccountDashboard } from "@/components/blocks/account/account-dashboard"
import { OrdersList } from "@/components/blocks/account/orders-list"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { AppOrder } from "@/lib/types"

function AccountPageInner() {
  const { customer, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderSuccess = searchParams.get("order")

  useEffect(() => {
    if (!authLoading && !customer) router.replace("/login")
  }, [authLoading, customer, router])

  const { data: orders, isPending: ordersLoading } = useQuery<AppOrder[]>({
    queryKey: ["orders"],
    queryFn: async () => {
      const res = await fetch("/api/orders?limit=50")
      if (!res.ok) return []
      const data = await res.json()
      return Array.isArray(data) ? data : (data.orders ?? [])
    },
    enabled: !!customer,
  })

  if (authLoading || !customer) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <Skeleton className="h-9 w-36 mb-10" />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Dashboard left col */}
          <div className="space-y-4">
            <div className="rounded-xl border border-border p-6 space-y-4">
              <Skeleton className="h-9 w-48" />
              <Skeleton className="h-14 w-14 rounded-full" />
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-lg" />
              ))}
            </div>
          </div>
          {/* Orders */}
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-6 w-32" />
            {[...Array(2)].map((_, i) => (
              <div key={i} className="rounded-xl border border-border p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <div className="flex gap-2">
                  {[...Array(4)].map((_, j) => (
                    <Skeleton key={j} className="h-14 w-12 rounded-lg" />
                  ))}
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight mb-10">حسابي</h1>

      {orderSuccess && (
        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800 px-5 py-4">
          <p className="text-sm font-medium text-green-800 dark:text-green-300">
            تم تقديم الطلب #{orderSuccess} بنجاح! سنتواصل معك قريباً.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div>
          <AccountDashboard customer={customer} />
          <div className="mt-4 rounded-xl border border-border p-5">
            <h3 className="font-semibold mb-3 text-sm">روابط سريعة</h3>
            <nav className="space-y-1">
              {[
                { label: "جميع المنتجات", href: "/products" },
                { label: "سلتي", href: "/cart" },
                { label: "إعدادات الحساب", href: "/account/settings" },
                { label: "تغيير كلمة المرور", href: "/account/password" },
              ].map((link) => (
                <Button key={link.href} variant="ghost" size="sm" className="w-full justify-start" asChild>
                  <Link href={link.href}>{link.label}</Link>
                </Button>
              ))}
            </nav>
          </div>
        </div>

        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold mb-6">سجل الطلبات</h2>
          <OrdersList orders={orders ?? []} isLoading={ordersLoading} />
        </div>
      </div>
    </div>
  )
}

export default function AccountPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <Skeleton className="h-48 w-full rounded-xl" />
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        </div>
      </div>
    }>
      <AccountPageInner />
    </Suspense>
  )
}
