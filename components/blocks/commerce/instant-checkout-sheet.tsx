"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useCartIdStore } from "@/stores/cart-id-store";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, X } from "lucide-react";
import { formatPrice } from "@/lib/types";
import {
  metaAddToCartParams,
  metaPurchaseParams,
  trackMetaEvent,
} from "@/lib/meta-pixel-client";
import type { AppProduct, AppVariant } from "@/lib/types";

const GOVERNORATES = [
  "تونس",
  "أريانة",
  "بن عروس",
  "منوبة",
  "بنزرت",
  "باجة",
  "قفصة",
  "قليبية",
  "سيدي بوزيد",
  "سليانة",
  "صفاقس",
  "سوسة",
  "تطاوين",
  "توزر",
  "القيروان",
  "المهدية",
  "المنستير",
  "نابل",
  "قابس",
  "قبلي",
  "جندوبة",
  "القصرين",
  "الكاف",
  "مدنين",
  "زغوان",
];

interface InstantCheckoutSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: AppProduct;
  selectedVariantId: string | null;
  quantity: number;
}

export function InstantCheckoutSheet({
  open,
  onOpenChange,
  product,
  selectedVariantId,
  quantity,
}: InstantCheckoutSheetProps) {
  const router = useRouter();
  const { toast } = useToast();
  const setCartId = useCartIdStore((s) => s.setCartId);
  const { customer } = useAuth();

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    city: "",
    address: "",
    email: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (customer && open) {
      setForm((prev) => ({
        ...prev,
        fullName: prev.fullName || [customer.firstName, customer.lastName].filter(Boolean).join(" "),
        email: prev.email || customer.email,
      }))
    }
  }, [customer, open]);

  const activeVariant =
    product.variants.find((v: AppVariant) => v.id === selectedVariantId) ??
    product.variants[0];
  const price = activeVariant?.price ?? 0;
  const imageUrl = product.images?.[0]?.url;

  function set(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedVariantId || !activeVariant) {
      setError("يرجى اختيار المتغير المناسب للمنتج.");
      return;
    }

    if (
      !form.fullName ||
      !form.phone ||
      !form.city ||
      !form.address ||
      !form.email
    ) {
      setError("يرجى تعبئة جميع الحقول المطلوبة.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Create a fresh cart for this instant checkout
      const cartRes = await fetch("/api/cart", {
        method: "POST",
        credentials: "same-origin",
      });
      if (!cartRes.ok) throw new Error("تعذر إنشاء السلة.");
      const cart = await cartRes.json();
      const cartId = cart.id;
      setCartId(cartId);

      // 2. Add item to cart
      const addRes = await fetch(`/api/cart/${cartId}/items`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId: selectedVariantId, quantity }),
      });

      if (!addRes.ok) {
        const body = await addRes.json().catch(() => ({}));
        throw new Error(body.error || "تعذر إضافة المنتج للسلة.");
      }

      trackMetaEvent(
        "AddToCart",
        metaAddToCartParams(product, activeVariant.price, quantity),
      );

      // 3. Create order
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cartId,
          email: form.email,
          firstName: form.fullName,
          lastName: "",
          phone: form.phone,
          city: form.city,
          address: form.address,
          countryCode: "tn",
        }),
      });

      if (!orderRes.ok) {
        const body = await orderRes.json().catch(() => ({}));
        throw new Error(body.error || "تعذر إتمام الطلب.");
      }

      const order = await orderRes.json();
      trackMetaEvent("Purchase", metaPurchaseParams(order));

      // 4. Success - redirect
      onOpenChange(false);
      const q = new URLSearchParams({
        order: String(order.displayId ?? ""),
        oid: String(order.id ?? ""),
      });
      router.push(`/checkout/success?${q.toString()}`);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "حدث خطأ. يرجى المحاولة مرة أخرى.";
      setError(msg);
      toast({
        variant: "destructive",
        title: "خطأ في الطلب",
        description: msg,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md flex flex-col h-full p-0"
      >
        <div className="flex items-center justify-between p-4 border-b">
          <SheetHeader>
            <SheetTitle className="text-lg">إتمام الشراء</SheetTitle>
          </SheetHeader>
          <SheetClose asChild>
            <button className="rounded-md p-1 hover:bg-muted transition-colors">
              <X className="h-5 w-5" />
            </button>
          </SheetClose>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Product Summary */}
          <div className="flex gap-3 p-3 rounded-lg bg-muted/50">
            {imageUrl && (
              <div className="relative w-16 h-16 rounded-md overflow-hidden shrink-0">
                <Image
                  src={imageUrl}
                  alt={product.title}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{product.title}</p>
              {activeVariant?.title && (
                <p className="text-xs text-muted-foreground">
                  {activeVariant.title}
                </p>
              )}
              <div className="flex items-center gap-2 mt-1">
                <span className="font-bold text-sm">{formatPrice(price)}</span>
                <span className="text-xs text-muted-foreground">
                  × {quantity}
                </span>
              </div>
            </div>
          </div>

          {/* Checkout Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="instant-fullName">الاسم الكامل *</Label>
              <Input
                id="instant-fullName"
                placeholder="أحمد محمد"
                value={form.fullName}
                onChange={(e) => set("fullName", e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="instant-phone">رقم الهاتف *</Label>
              <Input
                id="instant-phone"
                type="tel"
                placeholder="+216 XX XXX XXX"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="instant-email">البريد الإلكتروني *</Label>
              <Input
                id="instant-email"
                type="email"
                placeholder="example@email.com"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="instant-city">المدينة *</Label>
              <Select
                value={form.city}
                onValueChange={(val) => set("city", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر المدينة" />
                </SelectTrigger>
                <SelectContent>
                  {GOVERNORATES.map((gov) => (
                    <SelectItem key={gov} value={gov}>
                      {gov}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="instant-address">العنوان بالتفصيل *</Label>
              <Input
                id="instant-address"
                placeholder="الحي، الشارع، رقم المنزل"
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div className="pt-2">
              <div className="rounded-lg border border-border p-3 flex items-center gap-3 bg-muted/30 mb-4">
                <svg
                  className="h-5 w-5 text-muted-foreground shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                  <line x1="1" y1="10" x2="23" y2="10"></line>
                </svg>
                <div>
                  <p className="text-sm font-medium">الدفع عند الاستلام</p>
                  <p className="text-xs text-muted-foreground">
                    لا دفع الآن. ادفع نقداً عند الاستلام.
                  </p>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base"
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    جاري إتمام الطلب...
                  </>
                ) : (
                  `إتمام الشراء — ${formatPrice(price * quantity)}`
                )}
              </Button>
            </div>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
