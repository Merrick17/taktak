"use client"

import { useState } from "react"
import { useCart } from "@/hooks/use-cart"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

export function PromoCodeField() {
  const { cart, applyPromoCode, clearPromoCode, isLoading } = useCart()
  const { toast } = useToast()
  const [code, setCode] = useState("")
  const [busy, setBusy] = useState(false)

  const applied = Boolean(cart?.promotionId && cart?.promotion?.code)

  async function apply(e: React.FormEvent) {
    e.preventDefault()
    if (!code.trim()) return
    setBusy(true)
    try {
      const result = await applyPromoCode(code.trim())
      if (result.ok) {
        toast({ title: "تم التطبيق", description: "تم تفعيل رمز الخصم." })
        setCode("")
      } else {
        toast({ title: "تعذر التطبيق", description: result.error, variant: "destructive" })
      }
    } finally {
      setBusy(false)
    }
  }

  async function clear() {
    setBusy(true)
    try {
      await clearPromoCode()
      toast({ title: "تم الإزالة", description: "تمت إزالة رمز الخصم." })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
      <Label className="text-sm font-medium">رمز الخصم</Label>
      {applied ? (
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="text-sm font-mono text-foreground">{cart?.promotion?.code}</p>
          <Button type="button" variant="outline" size="sm" onClick={clear} disabled={busy || isLoading}>
            إزالة
          </Button>
        </div>
      ) : (
        <form onSubmit={apply} className="flex gap-2">
          <Input
            placeholder="أدخل الرمز"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="font-mono"
            disabled={busy || isLoading}
          />
          <Button type="submit" variant="secondary" disabled={busy || isLoading}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : "تطبيق"}
          </Button>
        </form>
      )}
    </div>
  )
}
