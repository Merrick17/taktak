"use client"

import { use } from "react"
import { useQuery } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { CategoryForm, type CategoryFormData } from "../../_components/category-form"

export default function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  const { data: category, isPending, error } = useQuery({
    queryKey: ["admin-category", id],
    queryFn: async () => {
      const res = await fetch(`/api/categories/${id}`, { credentials: "include" })
      if (!res.ok) throw new Error("Failed to fetch category")
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

  if (error || !category) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-2">
        <p className="text-destructive font-medium">لم يتم العثور على التصنيف</p>
        <p className="text-sm text-muted-foreground">{error?.message ?? "حدث خطأ أثناء تحميل التصنيف."}</p>
      </div>
    )
  }

  const initial: CategoryFormData = {
    name: category.name ?? "",
    handle: category.handle ?? "",
    image: category.image ?? category.imageUrl ?? "",
  }

  return <CategoryForm categoryId={id} initial={initial} isEdit />
}
