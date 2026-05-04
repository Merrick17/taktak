"use client"

import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import type { AuthUser } from "@/hooks/use-auth"

export function AccountDashboard({ customer }: { customer: AuthUser }) {
  const router = useRouter()
  const { logout } = useAuth()

  async function handleLogout() {
    await logout()
    router.push("/")
  }

  const initials = [customer.firstName, customer.lastName]
    .filter(Boolean)
    .map((n) => n![0])
    .join("")
    .toUpperCase() || customer.email[0].toUpperCase()

  return (
    <div className="rounded-xl border border-border p-6">
      <div className="flex items-center gap-4">
        <div className="flex size-14 items-center justify-center rounded-full bg-foreground text-background font-semibold text-lg">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-base">
            {customer.firstName && customer.lastName
              ? `${customer.firstName} ${customer.lastName}`
              : customer.firstName ?? "حسابي"}
          </p>
          <p className="text-sm text-muted-foreground truncate">{customer.email}</p>
        </div>
      </div>

      <Separator className="my-5" />

      <div className="space-y-2">
        <div className="flex justify-between py-1.5 text-sm">
          <span className="text-muted-foreground">البريد الإلكتروني</span>
          <span className="font-medium">{customer.email}</span>
        </div>
      </div>

      <Separator className="my-5" />

      <Button
        variant="outline"
        className="w-full text-destructive hover:text-destructive hover:bg-destructive/5"
        onClick={handleLogout}
      >
        تسجيل الخروج
      </Button>
    </div>
  )
}
