"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError("")
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(typeof j.error === "string" ? j.error : "حدث خطأ")
      }
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">نسيت كلمة المرور؟</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين.
          </p>
        </div>

        {sent ? (
          <div className="rounded-lg border border-border bg-muted/40 p-6 text-center space-y-4">
            <p className="text-sm font-medium">تم الإرسال!</p>
            <p className="text-sm text-muted-foreground">
              تحقق من بريدك الإلكتروني للحصول على رابط إعادة التعيين.
            </p>
            <Link href="/login" className="text-sm font-medium hover:underline">
              العودة إلى تسجيل الدخول
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "جاري الإرسال..." : "إرسال رابط إعادة التعيين"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              <Link href="/login" className="font-medium hover:underline">
                العودة إلى تسجيل الدخول
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
