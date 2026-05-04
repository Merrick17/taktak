"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { useUiStore } from "@/stores/ui-store";
import { ProductGallery } from "@/components/blocks/commerce/product-gallery";
import { ProductDescription } from "@/components/blocks/commerce/product-description";
import { VariantSelector } from "@/components/blocks/commerce/variant-selector";
import { QuantitySelector } from "@/components/blocks/commerce/quantity-selector";
import { ProductGrid } from "@/components/blocks/commerce/product-grid";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { useInstantCheckoutStore } from "@/stores/instant-checkout-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/types";
import type { AppProduct } from "@/lib/types";
import { cn } from "@/lib/utils";
import { WishlistButton } from "@/hooks/use-wishlist";
import { Share2, Copy, CheckCheck, ShoppingCart, Zap } from "lucide-react";
import {
  metaAddToCartParams,
  metaViewContentParams,
  trackMetaEvent,
} from "@/lib/meta-pixel-client";

function ProductDetailSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
        {/* Gallery */}
        <div className="space-y-4">
          <Skeleton className="aspect-square w-full rounded-2xl" />
          <div className="flex gap-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-16 rounded-lg shrink-0" />
            ))}
          </div>
        </div>
        {/* Info */}
        <div className="flex flex-col gap-6">
          <div className="space-y-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-9 w-4/5" />
            <Skeleton className="h-8 w-28" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          {/* Variants */}
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <div className="flex gap-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-9 w-20 rounded-lg" />
              ))}
            </div>
          </div>
          {/* Qty + wishlist */}
          <div className="flex flex-col gap-4 pt-2">
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-28 rounded-lg" />
              <Skeleton className="h-10 w-10 rounded-lg" />
            </div>
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
          {/* Trust chips */}
          <div className="flex gap-4 pt-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-4 w-20" />
            ))}
          </div>
          {/* Share row */}
          <div className="flex items-center gap-2 pt-1">
            <Skeleton className="h-px flex-1" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-24 rounded-full" />
            <Skeleton className="h-8 w-24 rounded-full" />
            <Skeleton className="h-8 w-24 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductDetailContent() {
  const { handle } = useParams<{ handle: string }>();
  const router = useRouter();
  const { addItem, refreshCart, isLoading: cartLoading } = useCart();
  const { toast } = useToast();
  const openCart = useUiStore((s) => s.openCart);
  const openInstantCheckout = useInstantCheckoutStore((s) => s.openInstantCheckout);
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >({});
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: product, isPending } = useQuery<AppProduct | null>({
    queryKey: ["product", handle],
    queryFn: async () => {
      const res = await fetch(`/api/products/${handle}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!handle,
    staleTime: 60 * 1000,
  });

  const { data: related = [] } = useQuery<AppProduct[]>({
    queryKey: ["products-related", handle],
    queryFn: async () => {
      const res = await fetch("/api/products?limit=200");
      if (!res.ok) return [];
      const data = await res.json();
      const all: AppProduct[] = Array.isArray(data)
        ? data
        : (data.products ?? []);
      return all.filter((p) => p.handle !== handle).slice(0, 4);
    },
    enabled: !!handle,
  });

  useEffect(() => {
    if (isPending || !product) return;
    const variants = product.variants;
    if (!variants?.length) return;
    let variant = variants[0]!;
    if (Object.keys(selectedOptions).length > 0) {
      variant =
        product.variants.find((v) =>
          v.options?.every((o) => selectedOptions[o.name] === o.value),
        ) ?? variant;
    }
    trackMetaEvent(
      "ViewContent",
      metaViewContentParams(product, variant.price),
    );
  }, [isPending, product, selectedOptions]);

  if (isPending) return <ProductDetailSkeleton />;
  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <p className="text-lg font-medium">المنتج غير موجود</p>
      </div>
    );
  }

  function getActiveVariant() {
    if (!product?.variants?.length) return null;
    if (!Object.keys(selectedOptions).length) return product.variants[0];
    return (
      product.variants.find((v) =>
        v.options?.every((o) => selectedOptions[o.name] === o.value),
      ) ?? product.variants[0]
    );
  }

  const activeVariant = getActiveVariant();
  const price = activeVariant?.price ?? product.variants?.[0]?.price ?? 0;
  const currencyCode = "tnd";
  const discount = null;

  function getProductUrl() {
    return typeof window !== "undefined"
      ? window.location.href
      : `${process.env.NEXT_PUBLIC_APP_URL ?? "https://taktakstore.com"}/products/${handle}`;
  }

  async function shareWhatsApp() {
    const url = getProductUrl();
    const text = `شاهد هذا المنتج: ${product?.title ?? ""} — ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  async function shareFacebook() {
    const url = getProductUrl();
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      "_blank",
    );
  }

  async function copyLink() {
    await navigator.clipboard.writeText(getProductUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleAddToCart() {
    if (!activeVariant?.id) return;
    setAdding(true);
    try {
      await addItem(activeVariant.id, quantity);
      trackMetaEvent(
        "AddToCart",
        metaAddToCartParams(product!, activeVariant.price, quantity),
      );
      openCart();
    } catch (err) {
      const description =
        err instanceof Error ? err.message : "تعذر إضافة المنتج إلى السلة.";
      toast({
        variant: "destructive",
        title: "تعذر إضافة المنتج",
        description,
      });
    } finally {
      setAdding(false);
    }
  }

  function handleBuyNow() {
    if (!activeVariant?.id) {
      toast({
        variant: "destructive",
        title: "اختر المتغير",
        description: "يرجى اختيار المقاس أو اللون المناسب قبل الشراء.",
      });
      return;
    }
    openInstantCheckout(product!, activeVariant.id, quantity);
  }

  const images = product.images ?? [];

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <Breadcrumb
          className="mb-8"
          items={[
            { label: "الرئيسية", href: "/" },
            product.categories?.[0]
              ? { label: product.categories[0].name, href: `/category/${product.categories[0].handle}` }
              : { label: "المنتجات", href: "/products" },
            { label: product.title },
          ]}
        />
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
          <ProductGallery images={images} title={product.title} />

          <div className="flex flex-col gap-6">
            <div>
              {product.categories?.[0] && (
                <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase mb-2">
                  {product.categories[0].name}
                </p>
              )}
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {product.title}
              </h1>

              <div className="mt-3 flex items-center gap-3 flex-wrap">
                <span className="text-2xl font-bold">
                  {formatPrice(price, currencyCode)}
                </span>
                {discount && (
                  <Badge className="bg-foreground text-background text-xs font-semibold">
                    وفر {discount}%
                  </Badge>
                )}
              </div>
            </div>

            {product.description && (
              <ProductDescription markdown={product.description} />
            )}

            {product.variants?.[0]?.options &&
              product.variants[0].options.length > 0 && (
                <VariantSelector
                  options={product.variants
                    .flatMap((v) => v.options)
                    .reduce(
                      (acc, o) => {
                        const existing = acc.find((a) => a.name === o.name);
                        if (!existing)
                          acc.push({ name: o.name, values: [o.value], outOfStockValues: [] });
                        else if (!existing.values.includes(o.value))
                          existing.values.push(o.value);
                        return acc;
                      },
                      [] as { name: string; values: string[]; outOfStockValues: string[] }[],
                    ).map((opt) => ({
                      ...opt,
                      outOfStockValues: opt.values.filter((val) =>
                        product.variants
                          .filter((v) => v.options?.some((o) => o.name === opt.name && o.value === val))
                          .every((v) => v.inventory <= 0)
                      ),
                    }))}
                  selected={selectedOptions}
                  onChange={(optionName, value) =>
                    setSelectedOptions((prev) => ({
                      ...prev,
                      [optionName]: value,
                    }))
                  }
                />
              )}

            <div className="flex flex-col gap-4 pt-2">
              <div className="flex items-center gap-4">
                <QuantitySelector value={quantity} onChange={setQuantity} />
                <WishlistButton productId={product.id} />
                <span className={cn(
                  "text-sm",
                  activeVariant && activeVariant.inventory > 0
                    ? "text-muted-foreground"
                    : "text-destructive"
                )}>
                  {activeVariant
                    ? activeVariant.inventory > 0
                      ? `متوفر (${activeVariant.inventory})`
                      : "غير متوفر"
                    : "غير متوفر"}
                </span>
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  size="lg"
                  className="w-full h-14 text-base gap-2 shadow-lg shadow-primary/25"
                  onClick={handleBuyNow}
                  disabled={!activeVariant || (activeVariant?.inventory ?? 0) <= 0 || adding || cartLoading}
                >
                  <Zap className="size-5" />
                  اشترِ الآن — {formatPrice(price * quantity, currencyCode)}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full gap-2"
                  onClick={handleAddToCart}
                  disabled={!activeVariant || (activeVariant?.inventory ?? 0) <= 0 || adding || cartLoading}
                >
                  <ShoppingCart className="size-4" />
                  {adding ? "جاري الإضافة..." : "أضف للسلة"}
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 pt-2 text-xs text-muted-foreground">
              {["شحن مجاني", "إرجاع سهل", "دفع آمن"].map((label) => (
                <span key={label} className="flex items-center gap-1.5">
                  <svg
                    className="size-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M5 12l5 5L20 7" />
                  </svg>
                  {label}
                </span>
              ))}
            </div>

            {/* Share buttons */}
            <div className="flex items-center gap-2 pt-1 border-t border-border">
              <Share2 className="size-4 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground">مشاركة:</span>
              <button
                onClick={shareWhatsApp}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-border hover:bg-muted transition-colors"
                title="مشاركة عبر واتساب"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="size-3.5 fill-[#25D366]"
                  aria-hidden
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                واتساب
              </button>
              <button
                onClick={shareFacebook}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-border hover:bg-muted transition-colors"
                title="مشاركة على فيسبوك"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="size-3.5 fill-[#1877F2]"
                  aria-hidden
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                فيسبوك
              </button>
              <button
                onClick={copyLink}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-border hover:bg-muted transition-colors"
                title="نسخ الرابط"
              >
                {copied ? (
                  <CheckCheck className="size-3.5 text-green-500" />
                ) : (
                  <Copy className="size-3.5" />
                )}
                {copied ? "تم النسخ" : "نسخ الرابط"}
              </button>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <div className="mt-20">
            <h2 className="text-xl font-bold tracking-tight mb-8">
              قد يعجبك أيضاً
            </h2>
            <ProductGrid
              products={related}
              columns={4}
              currencyCode={currencyCode}
            />
          </div>
        )}
      </div>

    </>
  );
}

export default function ProductDetail() {
  return (
    <Suspense fallback={<ProductDetailSkeleton />}>
      <ProductDetailContent />
    </Suspense>
  );
}
