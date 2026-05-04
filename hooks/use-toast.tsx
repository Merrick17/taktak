"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export type ToastInput = {
  title?: string
  description?: string
  variant?: "default" | "destructive"
}

type ToastRecord = ToastInput & { id: string }

const ToastCtx = React.createContext<{ toast: (t: ToastInput) => void } | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastRecord[]>([])

  const toast = React.useCallback((t: ToastInput) => {
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`
    setToasts((prev) => [...prev, { ...t, id }])
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id))
    }, 4500)
  }, [])

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div
        className="fixed bottom-0 end-0 z-[100] flex max-h-screen w-full flex-col-reverse gap-2 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:bottom-4 sm:end-4 sm:max-w-[420px] sm:flex-col pointer-events-none"
        aria-live="polite"
        aria-relevant="additions text"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cn(
              "pointer-events-auto rounded-lg border border-border bg-background p-4 shadow-lg",
              t.variant === "destructive" &&
                "border-destructive/50 bg-destructive text-destructive-foreground"
            )}
          >
            {t.title ? <p className="font-semibold text-sm">{t.title}</p> : null}
            {t.description ? <p className="text-sm opacity-90 mt-1">{t.description}</p> : null}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

export function useToast() {
  const ctx = React.useContext(ToastCtx)
  if (!ctx) throw new Error("useToast must be used within ToastProvider")
  return ctx
}
