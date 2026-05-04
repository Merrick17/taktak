"use client"

/**
 * Cart id in localStorage (Zustand) drives which cart the client requests; the server
 * authorizes with an HTTP-only signed `cart` cookie. If either is stale, recover by
 * clearing storage and POST /api/cart to mint a new pair.
 */
import { useCallback, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useCartIdStore } from "@/stores/cart-id-store"

export const cartQueryKey = (cartId: string | null | undefined) => ["cart", cartId ?? ""] as const

export const CART_NOT_FOUND = "CART_NOT_FOUND"
export const CART_FORBIDDEN = "CART_FORBIDDEN"
export const CART_FETCH_FAILED = "CART_FETCH_FAILED"

async function parseCartError(res: Response): Promise<string> {
  const body = await res.json().catch(() => ({}))
  return typeof (body as { error?: unknown }).error === "string"
    ? (body as { error: string }).error
    : "تعذر تحديث السلة."
}

async function fetchCart(cartId: string) {
  const res = await fetch(`/api/cart/${cartId}`, { credentials: "same-origin" })
  if (res.status === 404) throw new Error(CART_NOT_FOUND)
  if (res.status === 403 || res.status === 401) throw new Error(CART_FORBIDDEN)
  if (!res.ok) throw new Error(CART_FETCH_FAILED)
  return res.json()
}

/** Ensures cart bootstrap runs once per page load (many components call `useCart`). */
let cartBootstrapStarted = false

async function resetCartClient(
  clearCartId: () => void,
  qc: ReturnType<typeof useQueryClient>,
  createCart: { mutateAsync: () => Promise<{ id: string } & Record<string, unknown>> }
) {
  clearCartId()
  qc.removeQueries({ queryKey: ["cart"] })
  cartBootstrapStarted = false
  await createCart.mutateAsync()
}

export function useCart() {
  const qc = useQueryClient()
  const cartId = useCartIdStore((s) => s.cartId)
  const setCartId = useCartIdStore((s) => s.setCartId)
  const clearCartId = useCartIdStore((s) => s.clearCartId)
  const initFromStorage = useCartIdStore((s) => s.initFromStorage)

  const createCart = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/cart", { method: "POST", credentials: "same-origin" })
      if (!res.ok) throw new Error("Failed to create cart")
      return res.json() as Promise<{ id: string } & Record<string, unknown>>
    },
    onSuccess: (c) => {
      setCartId(c.id)
      qc.setQueryData(cartQueryKey(c.id), c)
    },
  })

  useEffect(() => {
    if (cartBootstrapStarted) return
    cartBootstrapStarted = true
    initFromStorage()
    const id = useCartIdStore.getState().cartId
    if (!id) {
      void createCart.mutateAsync().catch(() => {})
    }
  }, [initFromStorage, createCart])

  // Stored cart id no longer matches cookie / DB — provision a fresh cart.
  useEffect(() => {
    const qState = qc.getQueryState(cartQueryKey(cartId))
    if (cartId && qState?.status === "error") {
      const msg = (qState.error as Error)?.message ?? ""
      if (msg === CART_NOT_FOUND || msg === CART_FORBIDDEN) {
        void resetCartClient(clearCartId, qc, createCart).catch(() => {})
      }
    }
  }, [cartId, qc, clearCartId, createCart])

  const {
    data: cart = null,
    isLoading: isCartQueryLoading,
    isError: isCartQueryError,
    error: cartQueryError,
  } = useQuery({
    queryKey: cartQueryKey(cartId),
    queryFn: () => fetchCart(cartId!),
    enabled: Boolean(cartId),
    retry: false,
  })

  const setCartCache = useCallback(
    (id: string, data: unknown) => {
      qc.setQueryData(cartQueryKey(id), data)
    },
    [qc]
  )

  const addItemMut = useMutation({
    mutationFn: async ({ variantId, quantity }: { variantId: string; quantity: number }) => {
      let id = useCartIdStore.getState().cartId
      if (!id) {
        const created = await createCart.mutateAsync()
        id = created.id
      }

      const doAdd = async (cid: string) =>
        fetch(`/api/cart/${cid}/items`, {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ variantId, quantity }),
        })

      let res = await doAdd(id)

      if (res.status === 404) {
        const body = await res.json().catch(() => ({}))
        if ((body as { code?: string }).code === "CART_NOT_FOUND") {
          await resetCartClient(clearCartId, qc, createCart)
          id = useCartIdStore.getState().cartId!
          res = await doAdd(id)
        }
      }

      if (res.status === 403 || res.status === 401) {
        await resetCartClient(clearCartId, qc, createCart)
        id = useCartIdStore.getState().cartId!
        res = await doAdd(id)
      }

      if (!res.ok) {
        const msg = await parseCartError(res)
        throw new Error(msg)
      }
      return res.json()
    },
    onSuccess: (data) => {
      const id = useCartIdStore.getState().cartId
      if (id) setCartCache(id, data)
    },
  })

  const updateItemMut = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      const id = useCartIdStore.getState().cartId
      if (!id) throw new Error("No cart")
      const res = await fetch(`/api/cart/${id}/items/${itemId}`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      })
      if (!res.ok) {
        throw new Error(await parseCartError(res))
      }
      return res.json()
    },
    onSuccess: (data) => {
      const id = useCartIdStore.getState().cartId
      if (id) setCartCache(id, data)
    },
  })

  const removeItemMut = useMutation({
    mutationFn: async (itemId: string) => {
      const id = useCartIdStore.getState().cartId
      if (!id) throw new Error("No cart")
      const res = await fetch(`/api/cart/${id}/items/${itemId}`, {
        method: "DELETE",
        credentials: "same-origin",
      })
      if (!res.ok) {
        throw new Error(await parseCartError(res))
      }
      return res.json()
    },
    onSuccess: (data) => {
      const id = useCartIdStore.getState().cartId
      if (id) setCartCache(id, data)
    },
  })

  const addItem = useCallback(
    async (variantId: string, quantity = 1) => {
      await addItemMut.mutateAsync({ variantId, quantity })
    },
    [addItemMut]
  )

  const updateItem = useCallback(
    async (itemId: string, quantity: number) => {
      await updateItemMut.mutateAsync({ itemId, quantity })
    },
    [updateItemMut]
  )

  const removeItem = useCallback(
    async (itemId: string) => {
      await removeItemMut.mutateAsync(itemId)
    },
    [removeItemMut]
  )

  const refreshCart = useCallback(async () => {
    clearCartId()
    qc.removeQueries({ queryKey: ["cart"] })
    cartBootstrapStarted = false
    try {
      const created = await createCart.mutateAsync()
      setCartCache(created.id, created)
    } catch {
      // silent
    }
  }, [clearCartId, createCart, qc, setCartCache])

  const applyPromoCode = useCallback(
    async (code: string) => {
      const id = useCartIdStore.getState().cartId
      if (!id) return { ok: false as const, error: "السلة غير جاهزة." }
      const res = await fetch(`/api/cart/${id}/promotion`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        return {
          ok: false as const,
          error: typeof body.error === "string" ? body.error : "تعذر تطبيق الرمز.",
        }
      }
      const updated = await res.json()
      setCartCache(id, updated)
      return { ok: true as const }
    },
    [setCartCache]
  )

  const clearPromoCode = useCallback(async () => {
    const id = useCartIdStore.getState().cartId
    if (!id) return
    const res = await fetch(`/api/cart/${id}/promotion`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: null }),
    })
    if (res.ok) {
      const updated = await res.json()
      setCartCache(id, updated)
    }
  }, [setCartCache])

  const isLoading =
    createCart.isPending ||
    addItemMut.isPending ||
    updateItemMut.isPending ||
    removeItemMut.isPending

  const isCartDataLoading = Boolean(cartId) && isCartQueryLoading

  return {
    cart,
    cartId,
    isLoading,
    isCartDataLoading,
    isCartQueryError,
    cartQueryError,
    isCreatingCart: createCart.isPending,
    addItem,
    updateItem,
    removeItem,
    refreshCart,
    applyPromoCode,
    clearPromoCode,
  }
}
