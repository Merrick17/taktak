import { create } from "zustand";
import type { AppProduct } from "@/lib/types";

export type InstantCheckoutPayload = {
  product: AppProduct;
  variantId: string;
  quantity: number;
};

type InstantCheckoutState = {
  payload: InstantCheckoutPayload | null;
  openInstantCheckout: (
    product: AppProduct,
    variantId: string,
    quantity?: number,
  ) => void;
  closeInstantCheckout: () => void;
};

export const useInstantCheckoutStore = create<InstantCheckoutState>((set) => ({
  payload: null,
  openInstantCheckout: (product, variantId, quantity = 1) =>
    set({ payload: { product, variantId, quantity } }),
  closeInstantCheckout: () => set({ payload: null }),
}));
