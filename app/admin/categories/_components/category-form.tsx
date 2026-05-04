"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { AdminFormLayout } from "@/components/admin/admin-form-layout"
import { slugifyHandleFromTitle } from "@/lib/slugify"
import { ImagePlus, Loader2, X } from "lucide-react"

export interface CategoryFormData {
  name: string
  handle: string
  image: string
}

interface CategoryFormProps {
  categoryId?: string
  initial?: CategoryFormData
  isEdit?: boolean
}

export function CategoryForm({ categoryId, initial, isEdit = false }: CategoryFormProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState<CategoryFormData>(
    initial ?? { name: "", handle: "", image: "" }
  )
  const [uploading, setUploading] = useState(false)

  async function handleImageUpload(file: File) {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/admin/uploads/image", {
        method: "POST",
        credentials: "include",
        body: formData,
      })
      if (!res.ok) throw new Error("فشل رفع الصورة")
      const { url } = await res.json()
      setForm((f) => ({ ...f, image: url }))
    } catch (e: unknown) {
      toast({ variant: "destructive", title: "خطأ", description: (e as Error).message })
    } finally {
      setUploading(false)
    }
  }

  const saveMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      const url = isEdit ? `/api/categories/${categoryId}` : "/api/categories"
      const method = isEdit ? "PATCH" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(typeof j.error === "string" ? j.error : "فشل الحفظ")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] })
      queryClient.invalidateQueries({ queryKey: ["categories"] })
      toast({ title: "تم الحفظ", description: isEdit ? "تم تحديث التصنيف." : "تم إنشاء التصنيف." })
      router.push("/admin/categories")
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "خطأ", description: e.message }),
  })

  return (
    <AdminFormLayout
      title={isEdit ? "تعديل التصنيف" : "تصنيف جديد"}
      backHref="/admin/categories"
      backLabel="التصنيفات"
      onSave={() => {
        if (!form.name.trim()) {
          toast({ variant: "destructive", title: "حقل مطلوب", description: "اسم التصنيف مطلوب." })
          return
        }
        if (!form.handle.trim()) {
          toast({ variant: "destructive", title: "حقل مطلوب", description: "المعرف (Handle) مطلوب." })
          return
        }
        saveMutation.mutate(form)
      }}
      saving={saveMutation.isPending}
      saveLabel={isEdit ? "تحديث" : "إنشاء"}
    >
      <div className="space-y-6">
        <section className="space-y-4">
          <h2 className="text-base font-semibold border-b pb-2">بيانات التصنيف</h2>
          <div className="space-y-1.5">
            <Label>اسم التصنيف *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>المعرف (Handle) *</Label>
            <div className="flex gap-2">
              <Input
                value={form.handle}
                onChange={(e) => setForm({ ...form, handle: e.target.value })}
                placeholder="my-category"
                required
                className="font-mono text-sm"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => setForm((f) => ({ ...f, handle: slugifyHandleFromTitle(f.name) }))}
              >
                إنشاء تلقائي
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">يُستخدم في الرابط: /category/handle</p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-base font-semibold border-b pb-2">صورة التصنيف</h2>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleImageUpload(file)
              e.target.value = ""
            }}
          />
          {form.image ? (
            <div className="relative inline-block">
              <div className="relative h-40 w-full max-w-sm overflow-hidden rounded-xl border bg-muted">
                <Image
                  src={form.image}
                  alt="صورة التصنيف"
                  fill
                  className="object-cover"
                  sizes="384px"
                />
              </div>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute -right-2 -top-2 size-6 rounded-full"
                onClick={() => setForm((f) => ({ ...f, image: "" }))}
              >
                <X className="size-3" />
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex h-40 w-full max-w-sm flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/30 text-muted-foreground transition hover:border-primary hover:text-primary disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="size-6 animate-spin" />
              ) : (
                <ImagePlus className="size-6" />
              )}
              <span className="text-sm">{uploading ? "جاري الرفع..." : "اضغط لرفع صورة"}</span>
            </button>
          )}
          <p className="text-xs text-muted-foreground">
            تُعرض كصورة غلاف في صفحة التصنيف على المتجر.
          </p>
        </section>
      </div>
    </AdminFormLayout>
  )
}
