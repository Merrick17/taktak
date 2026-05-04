"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Copy, RefreshCw, CheckCircle2, ExternalLink } from "lucide-react"

const DEFAULT_SETTINGS: Record<string, string> = {
  store_name: "",
  store_tagline: "",
  shipping_fee: "0",
  support_whatsapp: "",
  social_instagram: "",
  social_facebook: "",
  social_tiktok: "",
  meta_pixel_id: "",
  catalog_token: "",
}

function generateToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(24)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

export default function AdminSettingsPage() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [draftSettings, setDraftSettings] = useState<Record<string, string>>({})
  const [copied, setCopied] = useState(false)
  const [regenConfirmOpen, setRegenConfirmOpen] = useState(false)

  const { data, isPending } = useQuery<Record<string, string>>({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const res = await fetch("/api/settings", { credentials: "include" })
      if (!res.ok) return {}
      return res.json()
    },
  })

  // Merge: defaults → server data → local drafts (only changed fields)
  const settings: Record<string, string> = { ...DEFAULT_SETTINGS, ...(data ?? {}), ...draftSettings }

  /** Only send fields the user actually changed (present in draftSettings) */
  const saveMutation = useMutation({
    mutationFn: async () => {
      // Only send the fields that the user modified (present in draftSettings)
      // plus any that were non-empty in the server data but need to be preserved
      const payload: Record<string, string> = {}
      for (const key of Object.keys(DEFAULT_SETTINGS)) {
        // If the user changed this field, send the draft value
        if (key in draftSettings) {
          payload[key] = draftSettings[key]
        } else if (data && key in data) {
          // Preserve existing server values that weren't changed
          payload[key] = data[key] ?? ""
        }
        // Skip keys that aren't in draft or server data (don't overwrite with defaults)
      }
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error("Failed")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] })
      queryClient.invalidateQueries({ queryKey: ["site-settings"] })
      setDraftSettings({})
      toast({ title: "تم الحفظ", description: "تم حفظ الإعدادات بنجاح." })
    },
    onError: () => toast({ variant: "destructive", title: "خطأ", description: "فشل حفظ الإعدادات." }),
  })

  function set(key: string, value: string) {
    setDraftSettings((prev) => ({ ...prev, [key]: value }))
  }

  async function copyToClipboard(text: string) {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function regenerateToken() {
    set("catalog_token", generateToken())
  }

  /** Public storefront origin for catalog/feeds — never use `window.location` here (admin may be on another host). */
  const storeUrl = (
    process.env.NEXT_PUBLIC_STORE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    "https://taktakstore.com"
  ).replace(/\/$/, "")
  const catalogUrl = settings.catalog_token ? `${storeUrl}/api/catalog?token=${settings.catalog_token}` : ""

  if (isPending) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">إعدادات المتجر</h1>
          <p className="text-muted-foreground text-sm sm:text-base">إدارة هوية المتجر والتواصل الاجتماعي وكتالوج المنتجات.</p>
        </div>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="gap-2 shrink-0 w-full sm:w-auto">
          {saveMutation.isPending && <Loader2 className="size-4 animate-spin" />}
          حفظ الإعدادات
        </Button>
        {Object.keys(draftSettings).length > 0 && (
          <Button type="button" variant="outline" onClick={() => setDraftSettings({})} className="shrink-0 w-full sm:w-auto">
            تراجع عن التعديلات
          </Button>
        )}
      </div>

      {/* Store identity */}
      <Card>
        <CardHeader>
          <CardTitle>هوية المتجر</CardTitle>
          <CardDescription>الاسم والشعار يظهران في الصفحات والبريد الإلكتروني وكتالوج المنتجات.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>اسم المتجر</Label>
              <Input
                value={settings.store_name}
                onChange={(e) => set("store_name", e.target.value)}
                placeholder="TakTak Store"
              />
            </div>
            <div className="space-y-1.5">
              <Label>الشعار / الوصف المختصر</Label>
              <Input
                value={settings.store_tagline}
                onChange={(e) => set("store_tagline", e.target.value)}
                placeholder="الموضة في متناول يدك"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shipping */}
      <Card>
        <CardHeader>
          <CardTitle>الشحن والتوصيل</CardTitle>
          <CardDescription>تكلفة الشحن تُضاف تلقائياً على إجمالي كل طلب. أدخل 0 لتفعيل الشحن المجاني.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-xs space-y-1.5">
            <Label>تكلفة الشحن (د.ت)</Label>
            <Input
              type="number"
              min="0"
              step="0.001"
              value={settings.shipping_fee}
              onChange={(e) => set("shipping_fee", e.target.value)}
              placeholder="0.000"
              dir="ltr"
            />
            <p className="text-xs text-muted-foreground">
              {parseFloat(settings.shipping_fee || "0") === 0
                ? "الشحن مجاني حالياً."
                : `تكلفة الشحن: ${parseFloat(settings.shipping_fee || "0").toFixed(3)} د.ت`}
            </p>
          </div>
          <div className="max-w-md space-y-1.5 pt-4 border-t border-border mt-4">
            <Label>واتساب الدعم (رقم دولي بدون +)</Label>
            <Input
              type="tel"
              inputMode="numeric"
              placeholder="216XXXXXXXX"
              value={settings.support_whatsapp}
              onChange={(e) => set("support_whatsapp", e.target.value.replace(/\D/g, ""))}
              dir="ltr"
            />
            <p className="text-xs text-muted-foreground">
              يظهر زر واتساب عائم للزوار عند تعبئة الرقم. اتركه فارغاً لإخفاء الزر.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Social media links */}
      <Card>
        <CardHeader>
          <CardTitle>روابط التواصل الاجتماعي</CardTitle>
          <CardDescription>تظهر في تذييل الموقع. أدخل الرابط الكامل لصفحتك.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="size-4 fill-current"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              Instagram
            </Label>
            <Input
              value={settings.social_instagram}
              onChange={(e) => set("social_instagram", e.target.value)}
              placeholder="https://www.instagram.com/yourpage"
              dir="ltr"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="size-4 fill-current"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              Facebook
            </Label>
            <Input
              value={settings.social_facebook}
              onChange={(e) => set("social_facebook", e.target.value)}
              placeholder="https://www.facebook.com/yourpage"
              dir="ltr"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="size-4 fill-current"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
              TikTok
            </Label>
            <Input
              value={settings.social_tiktok}
              onChange={(e) => set("social_tiktok", e.target.value)}
              placeholder="https://www.tiktok.com/@yourpage"
              dir="ltr"
            />
          </div>
        </CardContent>
      </Card>

      {/* Meta Pixel */}
      <Card>
        <CardHeader>
          <CardTitle>إعلانات ميتا (Meta Pixel)</CardTitle>
          <CardDescription>
            أدخل معرّف البيكسل من Events Manager لقياس الزيارات والمبيعات. الإعلانات نفسها تُنشأ من Meta Ads Manager.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-md space-y-1.5">
            <Label>معرّف بيكسل ميتا (أرقام فقط)</Label>
            <Input
              type="text"
              inputMode="numeric"
              placeholder="123456789012345"
              value={settings.meta_pixel_id}
              onChange={(e) => set("meta_pixel_id", e.target.value.replace(/\D/g, ""))}
              dir="ltr"
            />
            <p className="text-xs text-muted-foreground">
              يُحمّل تلقائياً على المتجر عند الحفظ. يُفضَّل المعرف المحفوظ هنا؛ إن كان فارغاً يُستخدم{" "}
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">NEXT_PUBLIC_META_PIXEL_ID</code>{" "}
              من البيئة إن وُجد. اترك الحقل فارغاً ولا تضبط المتغير لتعطيل البيكسل.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Catalog feed */}
      <Card>
        <CardHeader>
          <CardTitle>كتالوج المنتجات (البيع على الشبكات الاجتماعية)</CardTitle>
          <CardDescription>
            استخدم رابط الكتالوج لربط متجرك بـ Meta Commerce Manager (فيسبوك + إنستغرام) أو TikTok Seller Center.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* Token */}
          <div className="space-y-2">
            <Label>رمز الأمان (Token)</Label>
            <div className="flex gap-2">
              <Input value={settings.catalog_token} readOnly dir="ltr" className="font-mono text-xs" placeholder="اضغط 'توليد' للحصول على رمز" />
              <Button type="button" variant="outline" size="icon" onClick={() => setRegenConfirmOpen(true)} title="توليد رمز جديد">
                <RefreshCw className="size-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">احفظ الإعدادات بعد توليد الرمز لتفعيله.</p>
          </div>

          {/* Feed URL */}
          {catalogUrl && (
            <div className="space-y-2">
              <Label>رابط كتالوج المنتجات</Label>
              <div className="flex gap-2">
                <Input value={catalogUrl} readOnly dir="ltr" className="font-mono text-xs" />
                <Button type="button" variant="outline" size="icon" onClick={() => copyToClipboard(catalogUrl)}>
                  {copied ? <CheckCircle2 className="size-4 text-green-500" /> : <Copy className="size-4" />}
                </Button>
                <a href={catalogUrl} target="_blank" rel="noopener noreferrer">
                  <Button type="button" variant="outline" size="icon"><ExternalLink className="size-4" /></Button>
                </a>
              </div>
            </div>
          )}

          <Separator />

          {/* Instructions */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">تعليمات الربط</h3>

            <div className="rounded-lg bg-muted/50 border p-4 space-y-3">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <svg viewBox="0 0 24 24" className="size-4 fill-current"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                Meta Commerce Manager (فيسبوك + إنستغرام)
              </h4>
              <ol className="list-decimal list-inside space-y-1.5 text-xs text-muted-foreground">
                <li>افتح <a href="https://business.facebook.com/commerce" target="_blank" className="text-primary hover:underline">Meta Commerce Manager</a></li>
                <li>أنشئ كتالوجًا جديدًا واختر &quot;Data Feed&quot;</li>
                <li>الصق رابط الكتالوج أعلاه في حقل الرابط</li>
                <li>اضبط التزامن على &quot;Hourly&quot; أو &quot;Daily&quot;</li>
                <li>أكمل ربط الكتالوج بصفحتك وحساب الإعلانات</li>
              </ol>
            </div>

            <div className="rounded-lg bg-muted/50 border p-4 space-y-3">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <svg viewBox="0 0 24 24" className="size-4 fill-current"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
                TikTok Seller Center
              </h4>
              <ol className="list-decimal list-inside space-y-1.5 text-xs text-muted-foreground">
                <li>افتح <a href="https://seller.tiktok.com" target="_blank" className="text-primary hover:underline">TikTok Seller Center</a></li>
                <li>اذهب إلى Products → My Products → Add Products → By Spreadsheet / Feed URL</li>
                <li>اختر &quot;Schedule&quot; واختر JSON أو CSV كنوع ملف</li>
                <li>الصق رابط الكتالوج أعلاه</li>
                <li>اتبع التعليمات لمراجعة المنتجات ونشرها</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Regenerate token confirmation */}
      <Dialog open={regenConfirmOpen} onOpenChange={setRegenConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>توليد رمز أمان جديد؟</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground leading-relaxed">
            سيتم إبطال الرمز الحالي فوراً. أي خدمة تستخدم الرابط القديم لن تعمل بعد الآن.
            احفظ الإعدادات بعد التوليد لتفعيل الرمز الجديد.
          </p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setRegenConfirmOpen(false)}>
              إلغاء
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                regenerateToken()
                setRegenConfirmOpen(false)
              }}
            >
              توليد رمز جديد
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
