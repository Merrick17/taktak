"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface AuthFormProps {
  mode: "login" | "register"
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, register, customer, isLoading: authLoading } = useAuth()
  const [email, setEmail] = useState("")

  useEffect(() => {
    if (!authLoading && customer) {
      router.replace(customer.role === "admin" ? "/admin" : "/account")
    }
  }, [authLoading, customer, router])
  const [password, setPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setIsLoading(true)
    try {
      const next = searchParams.get("next")
      if (mode === "login") {
        const user = await login(email, password)
        if (next && next.startsWith("/") && !next.startsWith("//")) {
          router.push(next)
        } else if (user.role === "admin") {
          router.push("/admin")
        } else {
          router.push("/account")
        }
      } else {
        await register(email, password, firstName, lastName)
        router.push("/account")
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "حدث خطأ. يرجى المحاولة مرة أخرى."
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold">
          {mode === "login" ? "مرحباً بعودتك" : "إنشاء حساب"}
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          {mode === "login" ? "سجل الدخول إلى حسابك" : "انضم إلينا لتجربة تسوق أفضل"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "register" && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="firstName">الاسم الأول</Label>
              <Input id="firstName" placeholder="أحمد" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName">اسم العائلة</Label>
              <Input id="lastName" placeholder="محمد" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="email">البريد الإلكتروني *</Label>
          <Input id="email" type="email" placeholder="example@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">كلمة المرور *</Label>
            {mode === "login" && (
              <Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                نسيت كلمة المرور؟
              </Link>
            )}
          </div>
          <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
          {isLoading
            ? mode === "login" ? "جاري تسجيل الدخول..." : "جاري إنشاء الحساب..."
            : mode === "login" ? "تسجيل الدخول" : "إنشاء الحساب"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {mode === "login" ? (
          <>ليس لديك حساب؟{" "}<Link href="/register" className="font-medium text-foreground hover:underline">سجل الآن</Link></>
        ) : (
          <>لديك حساب بالفعل؟{" "}<Link href="/login" className="font-medium text-foreground hover:underline">سجل الدخول</Link></>
        )}
      </p>
    </div>
  )
}
