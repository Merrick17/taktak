"use client"

import { useState } from "react"
import Link from "next/link"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { Download, ChevronLeft, Loader2, Upload } from "lucide-react"

type ImportResponse = {
  created: number
  skippedEmpty: number
  failed: number
  errors: { row: number; message: string }[]
  warnings: { row: number; message: string }[]
}

export default function AdminProductsImportPage() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<ImportResponse | null>(null)

  const importMutation = useMutation({
    mutationFn: async (f: File) => {
      const fd = new FormData()
      fd.append("file", f)
      const res = await fetch("/api/admin/products/import", {
        method: "POST",
        body: fd,
        credentials: "include",
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(typeof j.error === "string" ? j.error : "فشل الاستيراد")
      }
      return j as ImportResponse
    },
    onSuccess: (data) => {
      setResult(data)
      queryClient.invalidateQueries({ queryKey: ["admin-products"] })
      if (data.created > 0) {
        toast({
          title: "اكتمل الاستيراد",
          description: `تم إنشاء ${data.created.toLocaleString("ar-TN")} منتجاً.`,
        })
      }
    },
    onError: (e: Error) => {
      toast({ variant: "destructive", title: "خطأ", description: e.message })
    },
  })

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">استيراد المنتجات من ملف</h1>
        <p className="text-muted-foreground text-sm sm:text-base mt-1">
          أضف عدة منتجات دفعة واحدة باستخدام ملف CSV (متوافق مع Excel).
        </p>
      </div>

      <ol className="space-y-6 list-decimal list-inside marker:font-semibold text-sm leading-relaxed">
        <li>
          <span className="font-medium text-foreground">تنزيل النموذج</span>
          <p className="mt-2 text-muted-foreground ps-6 -indent-6 sm:ps-0 sm:indent-0">
            حمّل ملف النموذج وافتحه في Excel أو Google Sheets. صف العناوين في الأعلى؛ كل صف بعده = منتج واحد مع
            سعر ومخزون واحد.
          </p>
          <div className="mt-3 ps-6 sm:ps-0">
            <Button variant="outline" size="sm" className="gap-2" asChild>
              <a href="/api/admin/products/import/template" download>
                <Download className="size-4" />
                تنزيل products-import-template.csv
              </a>
            </Button>
          </div>
        </li>

        <li>
          <span className="font-medium text-foreground">تعبئة البيانات</span>
          <ul className="mt-2 space-y-1.5 text-muted-foreground ps-6 list-disc list-outside">
            <li>الأعمدة المطلوبة: العنوان، اسم الرابط، السعر، رمز المخزون، الحالة.</li>
            <li>
              الحالة: اكتب <code className="text-xs bg-muted px-1 rounded">draft</code> (مسودة) أو{" "}
              <code className="text-xs bg-muted px-1 rounded">published</code> (منشور). المنتج المنشور يحتاج رابط
              صورة في العمود image_url.
            </li>
            <li>روابط الصور يجب أن تبدأ بـ https وتكون عامة (مثل رفع الصور يدوياً ثم نسخ الرابط).</li>
            <li>
              التصنيفات: ضع معرفات التصنيفات الموجودة مسبقاً مفصولة بفاصلة منقوطة، مثل:{" "}
              <code className="text-xs bg-muted px-1 rounded">electronics;kitchen</code>
            </li>
            <li>احفظ الملف بصيغة CSV UTF-8 (في Excel: حفظ باسم ← CSV UTF-8).</li>
          </ul>
        </li>

        <li>
          <span className="font-medium text-foreground">رفع الملف</span>
          <div className="mt-3 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center ps-6 sm:ps-0">
            <input
              type="file"
              accept=".csv,text/csv"
              className="text-sm file:me-2 file:rounded-md file:border file:bg-background file:px-3 file:py-1.5"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null
                if (f && !f.name.endsWith(".csv") && f.type !== "text/csv" && f.type !== "application/vnd.ms-excel") {
                  toast({ variant: "destructive", title: "نوع ملف غير مدعوم", description: "يرجى اختيار ملف CSV فقط." })
                  e.target.value = ""
                  setFile(null)
                  return
                }
                if (f && f.size > 5 * 1024 * 1024) {
                  toast({ variant: "destructive", title: "ملف كبير جداً", description: "حجم الملف يجب أن لا يتجاوز 5 ميغابايت." })
                  e.target.value = ""
                  setFile(null)
                  return
                }
                setFile(f)
                setResult(null)
              }}
            />
            <Button
              type="button"
              disabled={!file || importMutation.isPending}
              onClick={() => file && importMutation.mutate(file)}
              className="gap-2 shrink-0"
            >
              {importMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Upload className="size-4" />
              )}
              بدء الاستيراد
            </Button>
          </div>
        </li>
      </ol>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>نتيجة الاستيراد</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4 text-sm">
              <p>
                <span className="font-medium text-foreground">تم الإنشاء:</span>{" "}
                {result.created.toLocaleString("ar-TN")}
              </p>
              <p>
                <span className="font-medium text-foreground">صفوف فارغة تم تجاهلها:</span>{" "}
                {result.skippedEmpty.toLocaleString("ar-TN")}
              </p>
              <p>
                <span className="font-medium text-foreground">صفوف بها خطأ:</span>{" "}
                {result.failed.toLocaleString("ar-TN")}
              </p>
            </div>

            {result.warnings.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">تنبيهات (لم تمنع الاستيراد)</p>
                <div className="rounded-md border max-h-48 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-20">السطر</TableHead>
                        <TableHead>الرسالة</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.warnings.map((w, i) => (
                        <TableRow key={`w-${i}`}>
                          <TableCell>{w.row}</TableCell>
                          <TableCell>{w.message}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {result.errors.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2 text-destructive">أخطاء يجب تصحيحها في الملف</p>
                <div className="rounded-md border max-h-64 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-20">السطر</TableHead>
                        <TableHead>السبب</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.errors.map((err, i) => (
                        <TableRow key={`e-${i}`}>
                          <TableCell>{err.row}</TableCell>
                          <TableCell>{err.message}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            <Button variant="outline" asChild className="gap-2">
              <Link href="/admin/products">
                <ChevronLeft className="size-4" />
                العودة إلى قائمة المنتجات
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
