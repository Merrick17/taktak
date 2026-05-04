"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Search, ChevronDown } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { useCart } from "@/hooks/use-cart"
import { useAuth } from "@/hooks/use-auth"
import { useUiStore } from "@/stores/ui-store"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { CartDrawer } from "@/components/blocks/commerce/cart-drawer"
import { getCartItemCount } from "@/lib/types"
import type { AppCategory } from "@/lib/types"

/* ─── Logo ──────────────────────────────────────────────── */
function Logo() {
  return (
    <Link href="/" className="flex items-center shrink-0">
      <Image
        src="/assets/taktak_logo.png"
        alt="تكتك"
        width={110}
        height={40}
        className="h-9 w-auto object-contain"
        priority
      />
    </Link>
  )
}

/* ─── Overflow dropdown ("المزيد") ───────────────────────── */
function MoreDropdown({ categories, activeHandle }: { categories: AppCategory[]; activeHandle: string | null }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        المزيد
        <ChevronDown className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-2 min-w-40 rounded-lg border border-border bg-background shadow-lg py-1 z-50">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.handle}`}
              onClick={() => setOpen(false)}
              className={`block px-4 py-2 text-sm transition-colors hover:bg-muted ${activeHandle === cat.handle ? "text-primary font-semibold" : "text-foreground"}`}
            >
              {cat.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Desktop category nav ───────────────────────────────── */
const VISIBLE_COUNT = 5

function DesktopNav({ categories, isPending }: { categories: AppCategory[]; isPending: boolean }) {
  const pathname = usePathname()

  const activeHandle = pathname.startsWith("/category/")
    ? pathname.split("/category/")[1]?.split("/")[0] ?? null
    : null

  if (isPending) {
    return (
      <nav className="hidden items-center gap-5 md:flex">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-4 w-14 rounded" />
        ))}
      </nav>
    )
  }

  const visible = categories.slice(0, VISIBLE_COUNT)
  const overflow = categories.slice(VISIBLE_COUNT)

  return (
    <nav className="hidden items-center gap-5 md:flex">
      <Link
        href="/products"
        className={`text-sm font-medium transition-colors hover:text-primary ${!activeHandle && pathname === "/products" ? "text-primary" : "text-muted-foreground"}`}
      >
        الكل
      </Link>
      {visible.map((cat) => (
        <Link
          key={cat.id}
          href={`/category/${cat.handle}`}
          className={`text-sm font-medium transition-colors hover:text-primary ${activeHandle === cat.handle ? "text-primary" : "text-muted-foreground"}`}
        >
          {cat.name}
        </Link>
      ))}
      {overflow.length > 0 && (
        <MoreDropdown categories={overflow} activeHandle={activeHandle} />
      )}
    </nav>
  )
}

/* ─── Main header ────────────────────────────────────────── */
export function Header() {
  const { cart } = useCart()
  const { customer } = useAuth()
  const openCart = useUiStore((s) => s.openCart)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const itemCount = getCartItemCount(cart)
  const pathname = usePathname()

  const { data: categories = [], isPending } = useQuery<AppCategory[]>({
    queryKey: ["nav-categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories")
      if (!res.ok) return []
      return res.json()
    },
    staleTime: 5 * 60 * 1000,
  })

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">

          {/* Logo */}
          <Logo />

          {/* Category nav — desktop */}
          <DesktopNav categories={categories} isPending={isPending} />

          {/* Actions */}
          <div className="flex items-center gap-1">
            {/* Search */}
            <Button variant="ghost" size="icon" asChild>
              <Link href="/search" aria-label="بحث">
                <Search className="size-5" />
              </Link>
            </Button>

            {/* Account */}
            <Button variant="ghost" size="icon" asChild>
              <Link href={customer ? "/account" : "/login"} aria-label="الحساب">
                <svg xmlns="http://www.w3.org/2000/svg" className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </Link>
            </Button>

            {/* Admin link */}
            {customer?.role === "admin" && (
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex text-xs" asChild>
                <Link href="/admin">إدارة</Link>
              </Button>
            )}

            {/* Cart */}
            <Button variant="ghost" size="icon" onClick={openCart} className="relative" aria-label="السلة">
              <svg xmlns="http://www.w3.org/2000/svg" className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              <span className="absolute -end-0.5 -top-0.5 flex min-w-4 justify-center" aria-live="polite" aria-atomic="true">
                {itemCount > 0 ? (
                  <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {itemCount}
                  </span>
                ) : null}
              </span>
            </Button>

            {/* Hamburger — mobile only */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="القائمة"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile menu drawer */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="right" className="w-72 pt-4 overflow-y-auto">
          <SheetHeader className="pb-4">
            <SheetTitle className="text-start">
              <Logo />
            </SheetTitle>
          </SheetHeader>

          <nav className="flex flex-col gap-1 px-2">
            {/* Categories section */}
            <p className="px-3 pt-1 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              الأقسام
            </p>

            {isPending ? (
              <div className="flex flex-col gap-3 py-2 px-3">
                {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-5 w-32" />)}
              </div>
            ) : (
              <>
                <Link
                  href="/products"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted ${pathname === "/products" ? "bg-muted text-primary" : "text-foreground"}`}
                >
                  جميع المنتجات
                </Link>
                {categories.map((cat) => {
                  const isActive = pathname === `/category/${cat.handle}`
                  return (
                    <Link
                      key={cat.id}
                      href={`/category/${cat.handle}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted ${isActive ? "bg-muted text-primary" : "text-foreground"}`}
                    >
                      {cat.name}
                    </Link>
                  )
                })}
              </>
            )}

            {/* Account section */}
            <div className="mt-4 border-t border-border pt-4 flex flex-col gap-1">
              <p className="px-3 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                الحساب
              </p>
              <Link
                href={customer ? "/account" : "/login"}
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-md px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                {customer ? "حسابي" : "تسجيل الدخول"}
              </Link>
              {!customer && (
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-md px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  إنشاء حساب
                </Link>
              )}
              {customer?.role === "admin" && (
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-md px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  لوحة الإدارة
                </Link>
              )}
            </div>
          </nav>
        </SheetContent>
      </Sheet>

      <CartDrawer />
    </>
  )
}
