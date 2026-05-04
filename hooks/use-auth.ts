"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

export const SESSION_QUERY_KEY = ["session", "me"] as const

export type AuthUser = {
  id: string
  email: string
  firstName?: string | null
  lastName?: string | null
  role?: string | null
}

async function fetchMe(): Promise<AuthUser | null> {
  const res = await fetch("/api/users/me", { credentials: "same-origin" })
  if (res.status === 401) return null
  if (!res.ok) return null
  return res.json() as Promise<AuthUser>
}

export function useAuth() {
  const qc = useQueryClient()

  const { data: customer = null, isPending: sessionPending } = useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: fetchMe,
    staleTime: 60 * 1000,
  })

  const loginMut = useMutation({
    mutationFn: async (payload: { email: string; password: string }) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(typeof body.error === "string" ? body.error : "فشل تسجيل الدخول")
      }
      return res.json() as Promise<AuthUser>
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: SESSION_QUERY_KEY })
    },
  })

  const registerMut = useMutation({
    mutationFn: async (payload: {
      email: string
      password: string
      firstName?: string
      lastName?: string
    }) => {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(typeof body.error === "string" ? body.error : "فشل إنشاء الحساب")
      }
      return res.json() as Promise<AuthUser>
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: SESSION_QUERY_KEY })
    },
  })

  const logoutMut = useMutation({
    mutationFn: async () => {
      await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" })
    },
    onSettled: () => {
      qc.setQueryData(SESSION_QUERY_KEY, null)
      void qc.invalidateQueries({ queryKey: SESSION_QUERY_KEY })
    },
  })

  const login = async (email: string, password: string) => {
    return loginMut.mutateAsync({ email, password })
  }

  const register = async (email: string, password: string, firstName?: string, lastName?: string) => {
    return registerMut.mutateAsync({ email, password, firstName, lastName })
  }

  const logout = async () => {
    await logoutMut.mutateAsync()
  }

  const isLoading =
    sessionPending || loginMut.isPending || registerMut.isPending || logoutMut.isPending

  return {
    customer,
    isLoading,
    login,
    register,
    logout,
  }
}
