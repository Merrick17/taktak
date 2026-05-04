"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useCart } from "@/hooks/use-cart"
import { useCartIdStore } from "@/stores/cart-id-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { CheckoutFormInput } from "@/lib/types"
import { metaPurchaseParams, trackMetaEvent } from "@/lib/meta-pixel-client"

const INITIAL: CheckoutFormInput = {
  email: "",
  firstName: "",
  lastName: "",
  phone: "",
  address: "",
  city: "",
  countryCode: "tn",
}

export function CheckoutForm() {
  const router = useRouter()
  const { refreshCart } = useCart()
  const cartId = useCartIdStore((s) => s.cartId)
  const [form, setForm] = useState<CheckoutFormInput>(INITIAL)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [cartSessionInvalid, setCartSessionInvalid] = useState(false)

  function set(key: keyof CheckoutFormInput, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setError("")
    setCartSessionInvalid(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!cartId) {
      setError("السلة غير موجودة.")
      return
    }
    if (!form.email || !form.firstName || !form.phone || !form.address || !form.city) {
      setError("يرجى تعبئة جميع الحقول المطلوبة.")
      return
    }

    setIsSubmitting(true)
    try {
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cartId,
          email: form.email,
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone,
          address: form.address,
          city: form.city,
          countryCode: form.countryCode,
        }),
      })

      if (!orderRes.ok) {
        const body = await orderRes.json().catch(() => ({}))
        const apiMsg = typeof (body as { error?: unknown }).error === "string" ? (body as { error: string }).error : ""

        if (orderRes.status === 403) {
          setCartSessionInvalid(true)
          setError(
            "ربط السلة غير صالح (مثلاً انتهت الجلسة أو تم مسح ملفات تعريف الارتباط). أعد تهيئة السلة ثم أضف المنتجات مرة أخرى إذا كانت السلة فارغة."
          )
          return
        }

        if (orderRes.status === 400 && apiMsg) {
          setCartSessionInvalid(false)
          setError(apiMsg)
          return
        }

        setCartSessionInvalid(false)
        setError(apiMsg || "تعذر إتمام الطلب. يرجى المحاولة مرة أخرى.")
        return
      }

      const order = await orderRes.json()
      trackMetaEvent("Purchase", metaPurchaseParams(order))
      await refreshCart()
      const q = new URLSearchParams({
        order: String(order.displayId ?? ""),
        oid: String(order.id ?? ""),
      })
      router.push(`/checkout/success?${q.toString()}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "حدث خطأ. يرجى المحاولة مرة أخرى."
      setError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="font-semibold mb-4">بيانات التوصيل</h3>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">البريد الإلكتروني *</Label>
            <Input id="email" type="email" placeholder="example@email.com" value={form.email} onChange={(e) => set("email", e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="firstName">الاسم الأول *</Label>
              <Input id="firstName" placeholder="أحمد" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName">اسم العائلة</Label>
              <Input id="lastName" placeholder="محمد" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">رقم الهاتف *</Label>
            <Input id="phone" type="tel" placeholder="+216 XX XXX XXX" value={form.phone} onChange={(e) => set("phone", e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="address">العنوان *</Label>
            <Input id="address" placeholder="الشارع، رقم المبنى" value={form.address} onChange={(e) => set("address", e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="city">المدينة *</Label>
            <Input id="city" placeholder="تونس" value={form.city} onChange={(e) => set("city", e.target.value)} required />
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-4">طريقة الدفع</h3>
        <RadioGroup defaultValue="cod">
          <div className="rounded-lg border border-border p-4 flex items-center gap-3 bg-muted/30">
            <RadioGroupItem value="cod" id="cod" />
            <Label htmlFor="cod" className="cursor-pointer flex-1">
              <p className="font-medium">الدفع عند الاستلام</p>
              <p className="text-xs text-muted-foreground">ادفع عند استلام طلبك</p>
            </Label>
          </div>
        </RadioGroup>
      </div>

      {error && (
        <div className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-sm text-destructive">{error}</p>
          {cartSessionInvalid ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSubmitting}
              onClick={() => {
                setCartSessionInvalid(false)
                setError("")
                void refreshCart()
              }}
            >
              إعادة تهيئة السلة
            </Button>
          ) : null}
        </div>
      )}

      <Button
        type="submit"
        className="w-full pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        size="lg"
        disabled={isSubmitting}
      >
        {isSubmitting ? "جاري إتمام الطلب..." : "إتمام الطلب"}
      </Button>
    </form>
  )
}
