"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { AdminFormLayout } from "@/components/admin/admin-form-layout"

export interface PromoFormData {
  code: string
  value: number
  type: string
  isActive: boolean
  startDate: string
  endDate: string
  maxUses: string
  minOrderAmount: string
}

interface PromotionFormProps {
  promoId?: string
  initial?: PromoFormData
  isEdit?: boolean
}

export function PromotionForm({ promoId, initial, isEdit = false }: PromotionFormProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [form, setForm] = useState<PromoFormData>(initial ?? {
    code: "",
    value: 0,
    type: "percentage",
    isActive: true,
    startDate: "",
    endDate: "",
    maxUses: "",
    minOrderAmount: "",
  })

  const saveMutation = useMutation({
    mutationFn: async (data: PromoFormData) => {
      const url = isEdit ? `/api/promotions/${promoId}` : "/api/promotions"
      const method = isEdit ? "PATCH" : "POST"
      const payload: Record<string, unknown> = {
        code: data.code,
        value: data.value,
        type: data.type,
        isActive: data.isActive,
        startDate: data.startDate || null,
        endDate: data.endDate || null,
        maxUses: data.maxUses ? parseInt(data.maxUses, 10) : null,
        minOrderAmount: data.minOrderAmount ? parseFloat(data.minOrderAmount) : null,
      }
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(typeof j.error === "string" ? j.error : "فشل الحفظ")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-promotions"] })
      toast({ title: "تم الحفظ", description: isEdit ? "تم تحديث العرض." : "تم إنشاء العرض." })
      router.push("/admin/promotions")
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "خطأ", description: e.message }),
  })

  return (
    <AdminFormLayout
      title={isEdit ? "تعديل العرض" : "عرض جديد"}
      backHref="/admin/promotions"
      backLabel="العروض"
      onSave={() => {
        if (!form.code.trim()) {
          toast({ variant: "destructive", title: "حقل مطلوب", description: "كود الخصم مطلوب." })
          return
        }
        if (form.value <= 0) {
          toast({ variant: "destructive", title: "قيمة غير صالحة", description: "يجب أن تكون قيمة الخصم أكبر من صفر." })
          return
        }
        if (form.type === "percentage" && form.value > 100) {
          toast({ variant: "destructive", title: "قيمة غير صالحة", description: "نسبة الخصم لا يمكن أن تتجاوز 100%." })
          return
        }
        if (form.startDate && form.endDate && new Date(form.endDate) < new Date(form.startDate)) {
          toast({ variant: "destructive", title: "تاريخ غير صالح", description: "تاريخ الانتهاء يجب أن يكون بعد تاريخ البداية." })
          return
        }
        saveMutation.mutate(form)
      }}
      saving={saveMutation.isPending}
      saveLabel={isEdit ? "تحديث" : "إنشاء"}
    >
      <div className="space-y-6">
        <section className="space-y-4">
          <h2 className="text-base font-semibold border-b pb-2">بيانات العرض</h2>
          <div className="space-y-1.5">
            <Label>كود الخصم *</Label>
            <Input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              placeholder="SUMMER20"
              required
            />
            <p className="text-xs text-muted-foreground">يُدخله العميل عند الدفع للحصول على الخصم.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>النوع</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">نسبة مئوية (%)</SelectItem>
                  <SelectItem value="fixed">مبلغ ثابت (د.ت)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>القيمة *</Label>
              <Input
                type="number"
                min="0"
                step={form.type === "percentage" ? "1" : "0.001"}
                value={form.value}
                onChange={(e) => setForm({ ...form, value: parseFloat(e.target.value) || 0 })}
                required
              />
              <p className="text-xs text-muted-foreground">
                {form.type === "percentage" ? "مثال: 20 تعني 20% خصم" : "مثال: 5.000 تعني خصم 5 دنانير"}
              </p>
            </div>
          </div>

          {/* Active status */}
          <div className="flex items-center gap-3 rounded-lg border border-border p-4">
            <input
              type="checkbox"
              id="promo-active"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="size-4 rounded border-input"
            />
            <div>
              <Label htmlFor="promo-active" className="cursor-pointer font-medium leading-none">تفعيل العرض</Label>
              <p className="text-xs text-muted-foreground mt-1">
                العروض غير المفعلة لا يمكن استخدامها عند الدفع.
              </p>
            </div>
          </div>
        </section>

        {/* Dates & Limits */}
        <section className="space-y-4">
          <h2 className="text-base font-semibold border-b pb-2">مدة الصلاحية والحدود</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>تاريخ البداية</Label>
              <Input
                type="datetime-local"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                dir="ltr"
              />
              <p className="text-xs text-muted-foreground">اتركه فارغاً لبدء فوري.</p>
            </div>
            <div className="space-y-1.5">
              <Label>تاريخ الانتهاء</Label>
              <Input
                type="datetime-local"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                dir="ltr"
              />
              <p className="text-xs text-muted-foreground">اتركه فارغاً لصلاحية غير محددة.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>الحد الأقصى للاستخدامات</Label>
              <Input
                type="number"
                min="0"
                placeholder="غير محدود"
                value={form.maxUses}
                onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                dir="ltr"
              />
              <p className="text-xs text-muted-foreground">اتركه فارغاً لعدم تحديد حد.</p>
            </div>
            <div className="space-y-1.5">
              <Label>الحد الأدنى للطلب (د.ت)</Label>
              <Input
                type="number"
                min="0"
                step="0.001"
                placeholder="لا حد أدنى"
                value={form.minOrderAmount}
                onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })}
                dir="ltr"
              />
              <p className="text-xs text-muted-foreground">الخصم يُطبّق فقط إذا تجاوز الطلب هذا المبلغ.</p>
            </div>
          </div>
        </section>
      </div>
    </AdminFormLayout>
  )
}
