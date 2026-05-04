import { create } from "zustand"

/** Same key as legacy cart context for compatibility. */
export const CART_ID_STORAGE_KEY = "app_cart_id"

interface CartIdState {
  cartId: string | null
  /** Read `app_cart_id` from localStorage into the store (call once on client mount). */
  initFromStorage: () => void
  setCartId: (id: string | null) => void
  clearCartId: () => void
}

function readStoredId(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(CART_ID_STORAGE_KEY)
}

function writeStoredId(id: string | null) {
  if (typeof window === "undefined") return
  if (id) localStorage.setItem(CART_ID_STORAGE_KEY, id)
  else localStorage.removeItem(CART_ID_STORAGE_KEY)
}

export const useCartIdStore = create<CartIdState>((set) => ({
  cartId: null,
  initFromStorage: () => set({ cartId: readStoredId() }),
  setCartId: (id) => {
    writeStoredId(id)
    set({ cartId: id })
  },
  clearCartId: () => {
    writeStoredId(null)
    set({ cartId: null })
  },
}))
