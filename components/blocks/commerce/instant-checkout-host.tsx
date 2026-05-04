"use client";

import { useInstantCheckoutStore } from "@/stores/instant-checkout-store";
import { InstantCheckoutSheet } from "@/components/blocks/commerce/instant-checkout-sheet";

/** Renders the instant-buy sheet once at app root; open via `useInstantCheckoutStore`. */
export function InstantCheckoutHost() {
  const payload = useInstantCheckoutStore((s) => s.payload);
  const closeInstantCheckout = useInstantCheckoutStore((s) => s.closeInstantCheckout);

  if (!payload) return null;

  return (
    <InstantCheckoutSheet
      open
      onOpenChange={(open) => {
        if (!open) closeInstantCheckout();
      }}
      product={payload.product}
      selectedVariantId={payload.variantId}
      quantity={payload.quantity}
    />
  );
}
