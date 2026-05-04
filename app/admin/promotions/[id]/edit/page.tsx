"use client"

import { use } from "react"
import { useQuery } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { PromotionForm, type PromoFormData } from "../../_components/promotion-form"

export default function EditPromotionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  const { data: promo, isPending, error } = useQuery({
    queryKey: ["admin-promotion", id],
    queryFn: async () => {
      const res = await fetch(`/api/promotions/${id}`, { credentials: "include" })
      if (!res.ok) throw new Error("Failed to fetch promotion")
      return res.json()
    },
  })

  if (isPending) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !promo) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-2">
        <p className="text-destructive font-medium">لم يتم العثور على العرض</p>
        <p className="text-sm text-muted-foreground">{error?.message ?? "حدث خطأ أثناء تحميل العرض."}</p>
      </div>
    )
  }

  const initial: PromoFormData = {
    code: promo.code ?? "",
    value: Number(promo.value) ?? 0,
    type: promo.type ?? "percentage",
    isActive: promo.isActive ?? true,
    startDate: promo.startDate ? new Date(promo.startDate).toISOString().slice(0, 16) : "",
    endDate: promo.endDate ? new Date(promo.endDate).toISOString().slice(0, 16) : "",
    maxUses: promo.maxUses?.toString() ?? "",
    minOrderAmount: promo.minOrderAmount ? Number(promo.minOrderAmount).toFixed(3) : "",
  }

  return <PromotionForm promoId={id} initial={initial} isEdit />
}
