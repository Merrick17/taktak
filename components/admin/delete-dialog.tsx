"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface DeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  confirmLabel?: string
  loading?: boolean
  onConfirm: () => void
}

/**
 * Reusable confirmation dialog for destructive actions.
 * Replaces window.confirm() with a consistent, styled dialog.
 */
export function DeleteDialog({
  open,
  onOpenChange,
  title = "تأكيد الحذف",
  description = "لا يمكن التراجع عن هذا الإجراء. هل أنت متأكد؟",
  confirmLabel = "حذف نهائي",
  loading = false,
  onConfirm,
}: DeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            إلغاء
          </Button>
          <Button type="button" variant="destructive" disabled={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
