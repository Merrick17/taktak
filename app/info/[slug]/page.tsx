import Link from "next/link"

function InfoPageContent({ title, content }: { title: string; content: string }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight mb-8">{title}</h1>
      <div className="prose prose-slate dark:prose-invert max-w-none">
        <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
          {content}
        </p>
      </div>
    </div>
  )
}

export default function InfoPage({ params }: { params: { slug: string } }) {
  const pages: Record<string, { title: string; content: string }> = {
    "terms": {
      title: "الشروط والأحكام",
      content: "مرحباً بكم في متجرنا. باستخدامكم لهذا الموقع، فإنكم توافقون على الالتزام بالشروط والأحكام التالية...\n\n1. شروط الاستخدام: يجب استخدام الموقع للأغراض المخصصة له فقط.\n2. سياسة الدفع: نقبل الدفع عبر الوسائل المتاحة في صفحة الدفع.\n3. المسؤولية: نحن نسعى لتوفير أدق المعلومات، ولكننا غير مسؤولين عن أي أخطاء غير مقصودة."
    },
    "privacy": {
      title: "سياسة الخصوصية",
      content: "نحن نحترم خصوصيتكم ونلتزم بحماية بياناتكم الشخصية...\n\n- المعلومات التي نجمعها: الاسم، البريد الإلكتروني، وعنوان الشحن.\n- كيف نستخدم بياناتكم: لتحسين تجربة التسوق وتوصيل الطلبات.\n- مشاركة البيانات: لا نقوم ببيع بياناتكم لأي جهة ثالثة."
    },
    "about": {
      title: "من نحن",
      content: "متجرنا هو وجهتكم الأولى للحصول على أفضل المنتجات بجودة عالية وأسعار تنافسية. بدأنا بشغف لتقديم تجربة تسوق فريدة وسهلة لكل عملائنا.\n\nرؤيتنا هي أن نكون الخيار المفضل للتسوق الإلكتروني من خلال الالتزام بالجودة والسرعة في التوصيل والشفافية المطلقة."
    }
  }

  const page = pages[params.slug]

  if (!page) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center space-y-4">
        <p className="text-2xl font-bold">الصفحة غير موجودة</p>
        <p className="text-muted-foreground">لم نتمكن من العثور على الصفحة التي تبحث عنها.</p>
        <div className="flex justify-center gap-4 mt-6">
          <Link href="/" className="text-sm font-medium hover:underline">العودة للرئيسية</Link>
          <Link href="/products" className="text-sm font-medium hover:underline">تصفح المنتجات</Link>
        </div>
      </div>
    )
  }

  return <InfoPageContent title={page.title} content={page.content} />
}
