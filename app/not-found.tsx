import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center min-h-[calc(100svh-8rem)] px-4 text-center">
      <p className="text-8xl font-bold text-muted-foreground/20 mb-2 select-none">٤٠٤</p>
      <h1 className="text-2xl font-bold tracking-tight mb-3">الصفحة غير موجودة</h1>
      <p className="text-muted-foreground mb-8 max-w-sm">
        يبدو أن هذه الصفحة لا توجد. ربما تم نقلها أو حذفها.
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Button asChild>
          <Link href="/">العودة للرئيسية</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/products">تصفح المنتجات</Link>
        </Button>
      </div>
    </div>
  )
}
