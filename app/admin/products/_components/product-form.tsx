"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { AdminFormLayout } from "@/components/admin/admin-form-layout";
import { slugifyHandleFromTitle, shortImageLabel } from "@/lib/slugify";
import {
  Plus,
  ChevronUp,
  ChevronDown,
  Upload,
  X,
  Loader2,
  Wand2,
} from "lucide-react";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { SocialPreviewCard } from "@/components/admin/social-preview-card";

interface ProductVariant {
  id?: string;
  title?: string | null;
  sku: string;
  price: number;
  inventory: number;
  options: { name: string; value: string }[];
}

export interface ProductFormData {
  title: string;
  description: string;
  handle: string;
  status: string;
  adsBoosted: boolean;
  categoryIds: string[];
  images: { url: string; alt?: string }[];
  variants: ProductVariant[];
}

const emptyVariant = (): ProductVariant => ({
  sku: "",
  price: 0,
  inventory: 0,
  title: "",
  options: [],
});

export const emptyProductForm = (): ProductFormData => ({
  title: "",
  description: "",
  handle: "",
  status: "published",
  adsBoosted: false,
  categoryIds: [],
  images: [],
  variants: [emptyVariant()],
});

interface ProductFormProps {
  productId?: string;
  initial: ProductFormData;
  isEdit?: boolean;
}

export function ProductForm({
  productId,
  initial,
  isEdit = false,
}: ProductFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<ProductFormData>(initial);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const { data: categoryOptions = [] } = useQuery<
    { id: string; name: string; handle: string }[]
  >({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const url = isEdit ? `/api/products/${productId}` : "/api/products";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(typeof j.error === "string" ? j.error : "فشل الحفظ");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({
        title: "تم الحفظ",
        description: isEdit
          ? "تم تحديث المنتج بنجاح."
          : "تم إنشاء المنتج بنجاح.",
      });
      router.push("/admin/products");
    },
    onError: (e: Error) =>
      toast({ variant: "destructive", title: "خطأ", description: e.message }),
  });

  async function handleFiles(files: FileList | File[]) {
    const validFiles = Array.from(files).filter((f) =>
      ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(f.type),
    );
    if (validFiles.length === 0) {
      toast({
        variant: "destructive",
        title: "نوع ملف غير مدعوم",
        description: "يُقبل فقط صور JPEG, PNG, WebP, GIF.",
      });
      return;
    }
    setUploading(true);
    let added = 0;
    for (const file of validFiles) {
      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/admin/uploads/image", {
          method: "POST",
          body: fd,
          credentials: "include",
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok)
          throw new Error(typeof j.error === "string" ? j.error : "فشل الرفع");
        if (!j.url) throw new Error("لم يُرجع الرابط");
        setForm((prev) => ({
          ...prev,
          images: [...prev.images, { url: j.url }],
        }));
        added++;
      } catch (err) {
        toast({
          variant: "destructive",
          title: "خطأ في الرفع",
          description: err instanceof Error ? err.message : "فشل",
        });
      }
    }
    if (added > 0)
      toast({
        title: "تم الرفع",
        description: `تمت إضافة ${added} صورة${added > 1 ? "ات" : ""}.`,
      });
    setUploading(false);
  }

  function handlePickFile(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0)
      handleFiles(e.target.files);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
  }

  function moveImage(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= form.images.length) return;
    setForm((prev) => {
      const imgs = [...prev.images];
      const t = imgs[i]!;
      imgs[i] = imgs[j]!;
      imgs[j] = t;
      return { ...prev, images: imgs };
    });
  }

  function setVariant(i: number, patch: Partial<ProductVariant>) {
    setForm((prev) => {
      const variants = [...prev.variants];
      variants[i] = { ...variants[i]!, ...patch };
      return { ...prev, variants };
    });
  }

  /** Auto-generate a SKU from the product handle + 4-char random suffix */
  function generateSku(): string {
    const base = form.handle
      ? form.handle
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, "")
          .slice(0, 8)
      : "PRD";
    const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${base}-${suffix}`;
  }

  /** Auto-fill all empty SKUs */
  function autoFillEmptySkus() {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((v) =>
        !v.sku.trim() ? { ...v, sku: generateSku() } : v,
      ),
    }));
  }

  function handleSave() {
    if (!form.title.trim()) {
      toast({
        variant: "destructive",
        title: "حقل مطلوب",
        description: "عنوان المنتج مطلوب.",
      });
      return;
    }
    if (!form.handle.trim()) {
      toast({
        variant: "destructive",
        title: "حقل مطلوب",
        description: "اسم الرابط (handle) مطلوب.",
      });
      return;
    }
    // Auto-fill any empty SKUs before saving
    if (form.variants.some((v) => !v.sku.trim())) {
      setForm((prev) => ({
        ...prev,
        variants: prev.variants.map((v) =>
          !v.sku.trim() ? { ...v, sku: generateSku() } : v,
        ),
      }));
    }
    if (form.variants.some((v) => v.price <= 0)) {
      toast({
        variant: "destructive",
        title: "سعر غير صالح",
        description: "يجب أن يكون سعر كل متغير أكبر من صفر.",
      });
      return;
    }
    if (form.status === "published" && form.images.length === 0) {
      toast({
        variant: "destructive",
        title: "صور مطلوبة",
        description: "المنتجات المنشورة تحتاج صورة واحدة على الأقل.",
      });
      return;
    }
    saveMutation.mutate(form);
  }

  return (
    <AdminFormLayout
      title={isEdit ? "تعديل المنتج" : "منتج جديد"}
      backHref="/admin/products"
      backLabel="المنتجات"
      onSave={handleSave}
      saving={saveMutation.isPending || uploading}
      saveLabel={isEdit ? "تحديث" : "إنشاء"}
    >
      <div className="space-y-10">
        {/* Basic info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">المعلومات الأساسية</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label>عنوان المنتج *</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>اسم في الرابط *</Label>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  يُستخدم في عنوان صفحة المنتج على الإنترنت (أحرف لاتينية وأرقام
                  وشرطات).
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    value={form.handle}
                    onChange={(e) =>
                      setForm({ ...form, handle: e.target.value })
                    }
                    placeholder="my-product"
                    required
                    className="font-mono text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        handle: slugifyHandleFromTitle(f.title),
                      }))
                    }
                  >
                    إنشاء تلقائياً من العنوان
                  </Button>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>الحالة</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm({ ...form, status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="published">منشور</SelectItem>
                  <SelectItem value="draft">مسودة</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-border p-4">
              <Checkbox
                id="ads-boosted"
                checked={form.adsBoosted}
                onCheckedChange={(v) =>
                  setForm({ ...form, adsBoosted: v === true })
                }
              />
              <div className="space-y-1">
                <Label
                  htmlFor="ads-boosted"
                  className="cursor-pointer font-medium leading-none"
                >
                  ترويج المنتج (أولوية في العرض والإعلانات)
                </Label>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  يظهر المنتج في مقدمة القوائم ويُسهّل استخدامه في إعلانات
                  فيسبوك عند ربط متجرك بالكتالوج.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">التصنيفات</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">
              اختر تصنيفاً واحداً أو أكثر (اختياري).
            </p>
            {categoryOptions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                لا توجد تصنيفات بعد. أنشئ تصنيفات من قسم «التصنيفات» في القائمة.
              </p>
            ) : (
              <div className="flex flex-wrap gap-3 rounded-lg border border-border p-5">
                {categoryOptions.map((cat) => (
                  <label
                    key={cat.id}
                    className="flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <Checkbox
                      checked={form.categoryIds.includes(cat.id)}
                      onCheckedChange={() => {
                        setForm((f) => ({
                          ...f,
                          categoryIds: f.categoryIds.includes(cat.id)
                            ? f.categoryIds.filter((x) => x !== cat.id)
                            : [...f.categoryIds, cat.id],
                        }));
                      }}
                    />
                    <span>{cat.name}</span>
                  </label>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Images */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">الصور</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">
              المنتجات المنشورة تتطلب صورة واحدة على الأقل.
            </p>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              className="hidden"
              onChange={handlePickFile}
            />
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`rounded-lg border-2 border-dashed p-6 text-center transition-colors ${dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/30 bg-muted/30 hover:border-primary/50"}`}
            >
              <Upload className="size-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">اسحب الصور هنا أو</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2 mt-2"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
              >
                {uploading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Upload className="size-4" />
                )}
                اختيار ملفات
              </Button>
            </div>
            {form.images.length > 0 && (
              <ul className="flex flex-col gap-2">
                {form.images.map((img, i) => (
                  <li
                    key={`${img.url}-${i}`}
                    className="flex items-center gap-3 rounded-lg border p-2.5"
                  >
                    <div className="relative size-14 shrink-0 overflow-hidden rounded bg-muted">
                      <Image
                        src={img.url}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    </div>
                    <span
                      className="min-w-0 flex-1 text-xs text-muted-foreground truncate"
                      title={img.url}
                    >
                      {shortImageLabel(img.url)}
                    </span>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={() => moveImage(i, -1)}
                        disabled={i === 0}
                        aria-label="نقل للأعلى"
                      >
                        <ChevronUp className="size-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={() => moveImage(i, 1)}
                        disabled={i === form.images.length - 1}
                        aria-label="نقل للأسفل"
                      >
                        <ChevronDown className="size-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7 text-destructive"
                        onClick={() =>
                          setForm((p) => ({
                            ...p,
                            images: p.images.filter((_, j) => j !== i),
                          }))
                        }
                        aria-label="حذف الصورة"
                      >
                        <X className="size-3" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Variants */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg">المتغيرات</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={autoFillEmptySkus}
              >
                <Wand2 className="size-3.5" />
                تعبئة SKU تلقائياً
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() =>
                  setForm((p) => ({
                    ...p,
                    variants: [...p.variants, emptyVariant()],
                  }))
                }
              >
                <Plus className="size-3.5" /> إضافة متغير
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {form.variants.map((v, i) => (
              <div
                key={i}
                className="rounded-lg border p-5 sm:p-6 space-y-4 bg-card"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-muted-foreground">
                    متغير {i + 1}
                  </span>
                  {form.variants.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7 text-destructive"
                      onClick={() =>
                        setForm((p) => ({
                          ...p,
                          variants: p.variants.filter((_, j) => j !== i),
                        }))
                      }
                      aria-label="حذف المتغير"
                    >
                      <X className="size-3.5" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">الاسم</Label>
                    <Input
                      placeholder="الافتراضي"
                      value={v.title ?? ""}
                      onChange={(e) => setVariant(i, { title: e.target.value })}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs leading-snug">
                      رمز المخزون (SKU) *
                    </Label>
                    <div className="flex gap-1.5">
                      <Input
                        placeholder="يُولّد تلقائياً"
                        value={v.sku}
                        onChange={(e) => setVariant(i, { sku: e.target.value })}
                        className="h-8 text-sm flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-8 shrink-0"
                        onClick={() => setVariant(i, { sku: generateSku() })}
                        title="توليد SKU تلقائي"
                      >
                        <Wand2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">السعر (د.ت) *</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.001"
                      value={v.price}
                      onChange={(e) =>
                        setVariant(i, {
                          price: parseFloat(e.target.value) || 0,
                        })
                      }
                      required
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">المخزون</Label>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={v.inventory}
                      onChange={(e) =>
                        setVariant(i, {
                          inventory: parseInt(e.target.value) || 0,
                        })
                      }
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
                {/* Options */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      خيارات (لون، حجم...)
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs gap-1"
                      onClick={() =>
                        setVariant(i, {
                          options: [
                            ...(v.options ?? []),
                            { name: "", value: "" },
                          ],
                        })
                      }
                    >
                      <Plus className="size-3" /> خيار
                    </Button>
                  </div>
                  {v.options?.map((opt, oi) => (
                    <div key={oi} className="flex gap-2 items-center">
                      <Input
                        placeholder="الاسم"
                        value={opt.name}
                        onChange={(e) => {
                          const o = [...v.options];
                          o[oi] = { ...o[oi]!, name: e.target.value };
                          setVariant(i, { options: o });
                        }}
                        className="h-7 text-xs"
                      />
                      <Input
                        placeholder="القيمة"
                        value={opt.value}
                        onChange={(e) => {
                          const o = [...v.options];
                          o[oi] = { ...o[oi]!, value: e.target.value };
                          setVariant(i, { options: o });
                        }}
                        className="h-7 text-xs"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7 text-destructive shrink-0"
                        onClick={() =>
                          setVariant(i, {
                            options: v.options.filter((_, j) => j !== oi),
                          })
                        }
                        aria-label="حذف الخيار"
                      >
                        <X className="size-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Description */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">الوصف</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">
              يمكنك استخدام التنسيق: عناوين، قوائم، وروابط.
            </p>
            <RichTextEditor
              value={form.description}
              onChange={(v) => setForm({ ...form, description: v })}
            />
          </CardContent>
        </Card>

        {/* Social Media Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">معاينة مشاركة المنتج</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">
              هكذا سيظهر المنتج عند مشاركته على فيسبوك، انستغرام وتيك توك.
              الصورة والسعر يظهران تلقائياً.
            </p>
            <SocialPreviewCard
              title={form.title}
              description={
                form.description
                  ? form.description
                      .replace(/!\[.*?\]\(.*?\)/g, "")
                      .replace(/\[([^\]]+)\]\(.*?\)/g, "$1")
                      .replace(/#{1,6}\s?/g, "")
                      .replace(/(\*\*|__)(.*?)\1/g, "$2")
                      .replace(/(\*|_)(.*?)\1/g, "$2")
                      .replace(/`{1,3}[^`]*`{1,3}/g, "")
                      .replace(/>\s?/g, "")
                      .replace(/[-*+]\s/g, "")
                      .replace(/\n+/g, " ")
                      .trim()
                      .slice(0, 160)
                  : ""
              }
              image={form.images?.[0]?.url}
              price={form.variants?.[0]?.price ?? 0}
              handle={form.handle}
              siteName="تكتك"
            />
          </CardContent>
        </Card>
      </div>
    </AdminFormLayout>
  );
}
