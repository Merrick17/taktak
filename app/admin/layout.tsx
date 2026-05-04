"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  Tags,
  Users,
  ShoppingBag,
  BarChart3,
  Settings,
  LogOut,
  Percent,
  Menu,
  Moon,
  Sun,
  Search,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";

const ADMIN_NAV = [
  { label: "لوحة التحكم", href: "/admin", icon: LayoutDashboard },
  { label: "المنتجات", href: "/admin/products", icon: Package },
  { label: "التصنيفات", href: "/admin/categories", icon: Tags },
  { label: "العروض", href: "/admin/promotions", icon: Percent },
  { label: "العملاء", href: "/admin/customers", icon: Users },
  { label: "الطلبات", href: "/admin/orders", icon: ShoppingBag },
  { label: "التقارير", href: "/admin/analytics", icon: BarChart3 },
  { label: "الإعدادات", href: "/admin/settings", icon: Settings },
];

/** Searchable items for the global search. */
const SEARCH_ITEMS = [
  {
    label: "لوحة التحكم",
    href: "/admin",
    icon: LayoutDashboard,
    keywords: "dashboard",
  },
  {
    label: "المنتجات",
    href: "/admin/products",
    icon: Package,
    keywords: "products",
  },
  {
    label: "إضافة منتج",
    href: "/admin/products/new",
    icon: Package,
    keywords: "products new add",
  },
  {
    label: "استيراد المنتجات",
    href: "/admin/products/import",
    icon: Package,
    keywords: "products import csv",
  },
  {
    label: "التصنيفات",
    href: "/admin/categories",
    icon: Tags,
    keywords: "categories",
  },
  {
    label: "إضافة تصنيف",
    href: "/admin/categories/new",
    icon: Tags,
    keywords: "categories new add",
  },
  {
    label: "العروض",
    href: "/admin/promotions",
    icon: Percent,
    keywords: "promotions coupons discounts",
  },
  {
    label: "إضافة عرض",
    href: "/admin/promotions/new",
    icon: Percent,
    keywords: "promotions new add coupon",
  },
  {
    label: "العملاء",
    href: "/admin/customers",
    icon: Users,
    keywords: "customers users",
  },
  {
    label: "الطلبات",
    href: "/admin/orders",
    icon: ShoppingBag,
    keywords: "orders",
  },
  {
    label: "التقارير",
    href: "/admin/analytics",
    icon: BarChart3,
    keywords: "analytics reports",
  },
  {
    label: "الإعدادات",
    href: "/admin/settings",
    icon: Settings,
    keywords: "settings",
  },
];

function adminPageTitle(pathname: string): string {
  if (pathname === "/admin" || pathname === "/admin/") return "لوحة التحكم";
  if (pathname.startsWith("/admin/products/import")) return "استيراد المنتجات";
  if (pathname === "/admin/products/new") return "منتج جديد";
  if (/\/admin\/products\/[^/]+\/edit/.test(pathname)) return "تعديل منتج";
  if (pathname.startsWith("/admin/products")) return "المنتجات";
  if (pathname.startsWith("/admin/categories/new")) return "تصنيف جديد";
  if (/\/admin\/categories\/[^/]+\/edit/.test(pathname)) return "تعديل تصنيف";
  if (pathname.startsWith("/admin/categories")) return "التصنيفات";
  if (pathname.startsWith("/admin/promotions/new")) return "عرض جديد";
  if (/\/admin\/promotions\/[^/]+\/edit/.test(pathname)) return "تعديل عرض";
  if (pathname.startsWith("/admin/promotions")) return "العروض";
  if (
    pathname.startsWith("/admin/customers/") &&
    pathname !== "/admin/customers"
  )
    return "تفاصيل عميل";
  if (pathname.startsWith("/admin/customers")) return "العملاء";
  if (pathname.startsWith("/admin/orders/") && pathname !== "/admin/orders")
    return "تفاصيل الطلب";
  if (pathname.startsWith("/admin/orders")) return "الطلبات";
  if (pathname.startsWith("/admin/analytics")) return "التقارير";
  if (pathname.startsWith("/admin/settings")) return "الإعدادات";
  return "لوحة التحكم";
}

function AdminSidebarNav({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      <nav className="flex-1 p-5 space-y-1.5 overflow-y-auto">
        {ADMIN_NAV.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(item.href));
          return (
            <Button
              key={item.href}
              variant={isActive ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start gap-3 h-11 px-4 text-sm",
                isActive && "font-medium",
              )}
              asChild
            >
              <Link href={item.href} onClick={onNavigate}>
                <item.icon className="size-5" />
                {item.label}
              </Link>
            </Button>
          );
        })}
      </nav>

      <div className="p-5 border-t border-border space-y-1.5">
        <Button variant="ghost" className="w-full justify-start gap-3" asChild>
          <Link href="/" onClick={onNavigate}>
            العودة للمتجر
          </Link>
        </Button>
      </div>
    </>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const pageTitle = useMemo(() => adminPageTitle(pathname), [pathname]);
  const { customer: authUser, logout: authLogout } = useAuth();

  const displayName = useMemo(() => {
    if (!authUser) return "Admin";
    if (authUser.firstName || authUser.lastName)
      return `${authUser.firstName ?? ""} ${authUser.lastName ?? ""}`.trim();
    return "Admin";
  }, [authUser]);

  // Pending orders count for notification bell
  const { data: pendingCount } = useQuery<{ total: number }>({
    queryKey: ["admin-pending-orders-count"],
    queryFn: async () => {
      const now = new Date();
      const from = new Date(now);
      from.setDate(from.getDate() - 7);
      from.setHours(0, 0, 0, 0);
      const params = new URLSearchParams({
        limit: "1",
        page: "1",
        status: "pending",
      });
      const res = await fetch(`/api/orders?${params}`);
      if (!res.ok) return { total: 0 };
      const json = await res.json();
      return { total: json.total ?? 0 };
    },
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  // Initialize dark mode from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("admin-dark-mode");
    if (saved === "true") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  function toggleDarkMode() {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("admin-dark-mode", String(next));
  }

  const filteredSearch = useMemo(() => {
    if (!searchQuery.trim()) return SEARCH_ITEMS;
    const q = searchQuery.toLowerCase();
    return SEARCH_ITEMS.filter(
      (item) =>
        item.label.includes(q) ||
        item.keywords.toLowerCase().includes(q) ||
        item.label.toLowerCase().includes(q),
    );
  }, [searchQuery]);

  async function handleLogout() {
    setLogoutOpen(false);
    await authLogout();
    router.push("/");
    router.refresh();
  }

  // Cmd+K shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="hidden lg:flex w-72 shrink-0 border-l border-border bg-background flex-col sticky top-0 h-screen">
        <div className="p-7 border-b border-border">
          <Link
            href="/admin"
            className="flex items-center gap-2 font-bold text-xl min-w-0"
          >
            <span className="relative size-9 shrink-0 rounded-lg overflow-hidden bg-muted">
              <Image
                src="/assets/taktak_logo.png"
                alt=""
                fill
                className="object-contain p-0.5"
                sizes="40px"
                priority
              />
            </span>
            <span className="text-lg truncate">لوحة الإدارة</span>
          </Link>
        </div>
        <AdminSidebarNav pathname={pathname} />
        <div className="p-5 border-t border-border">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-11 px-4 text-sm text-destructive hover:text-destructive"
            onClick={() => setLogoutOpen(true)}
          >
            <LogOut className="size-5" />
            تسجيل الخروج
          </Button>
        </div>
      </aside>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent
          side="right"
          className="flex w-[min(100vw-2rem,20rem)] flex-col p-0 gap-0"
        >
          <SheetHeader className="p-6 border-b border-border text-start space-y-0">
            <SheetTitle className="flex items-center gap-2 font-bold text-lg">
              <span className="relative size-9 shrink-0 rounded-lg overflow-hidden bg-muted">
                <Image
                  src="/assets/taktak_logo.png"
                  alt=""
                  fill
                  className="object-contain p-0.5"
                  sizes="36px"
                />
              </span>
              لوحة الإدارة
            </SheetTitle>
          </SheetHeader>
          <div className="flex flex-1 flex-col min-h-0">
            <AdminSidebarNav
              pathname={pathname}
              onNavigate={() => setMobileNavOpen(false)}
            />
            <div className="p-4 border-t border-border mt-auto">
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-destructive hover:text-destructive"
                onClick={() => {
                  setMobileNavOpen(false);
                  setLogoutOpen(true);
                }}
              >
                <LogOut className="size-4" />
                تسجيل الخروج
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Global search dialog */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="sm:max-w-md p-0 gap-0">
          <DialogHeader className="sr-only">
            <DialogTitle>بحث سريع</DialogTitle>
          </DialogHeader>
          <div className="flex items-center border-b px-3">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <Input
              placeholder="بحث في لوحة الإدارة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-0 focus-visible:ring-0 h-11"
              autoFocus
            />
          </div>
          <div className="max-h-64 overflow-y-auto p-2">
            {filteredSearch.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                لا توجد نتائج
              </p>
            )}
            {filteredSearch.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  setSearchOpen(false);
                  setSearchQuery("");
                }}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors",
                  pathname === item.href && "bg-muted font-medium",
                )}
              >
                <item.icon className="size-4 text-muted-foreground" />
                {item.label}
              </Link>
            ))}
          </div>
          <div className="border-t px-3 py-2 text-xs text-muted-foreground text-center">
            اضغط{" "}
            <kbd className="px-1.5 py-0.5 rounded border bg-muted text-[10px] font-mono">
              Ctrl+K
            </kbd>{" "}
            للبحث
          </div>
        </DialogContent>
      </Dialog>

      <main className="flex-1 min-w-0 flex flex-col overflow-x-hidden">
        <header className="h-14 sm:h-16 border-b border-border bg-background px-4 sm:px-8 flex items-center justify-between gap-3 sticky top-0 z-10">
          <div className="flex items-center gap-2 min-w-0">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="lg:hidden shrink-0"
              onClick={() => setMobileNavOpen(true)}
              aria-label="فتح القائمة"
            >
              <Menu className="size-5" />
            </Button>
            <div className="min-w-0 flex flex-col gap-0.5">
              <span className="text-base font-semibold text-foreground truncate">
                {pageTitle}
              </span>
              <span className="text-xs text-muted-foreground truncate hidden sm:block">
                لوحة التحكم
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => setSearchOpen(true)}
              aria-label="بحث"
            >
              <Search className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 relative"
              onClick={() => router.push("/admin/orders?status=pending")}
              aria-label="الطلبات المعلقة"
            >
              <Bell className="size-4" />
              {(pendingCount?.total ?? 0) > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                  {pendingCount!.total > 99 ? "99+" : pendingCount!.total}
                </span>
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={toggleDarkMode}
              aria-label="تبديل الوضع الداكن"
            >
              {darkMode ? (
                <Sun className="size-4" />
              ) : (
                <Moon className="size-4" />
              )}
            </Button>
            <div
              className="size-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium"
              title={authUser?.email ?? ""}
            >
              {displayName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>
        <div className="flex-1 p-4 sm:p-8 min-w-0">{children}</div>
      </main>

      {/* Logout confirmation */}
      <Dialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تسجيل الخروج؟</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            هل أنت متأكد من رغبتك في تسجيل الخروج من لوحة الإدارة؟
          </p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLogoutOpen(false)}
            >
              إلغاء
            </Button>
            <Button type="button" variant="destructive" onClick={handleLogout}>
              تسجيل الخروج
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
