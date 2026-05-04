import { ReviewOne } from "@/components/review-01"

const REVIEWS = [
  {
    quote: "جودة المنتجات رائعة، وصل الطلب بسرعة كبيرة. أنصح بهذا المتجر بشدة!",
    author: "أحمد سالم",
    handle: "@ahmad_s",
    rating: 5,
    accentColor: "bg-primary/10 text-primary",
  },
  {
    quote: "التصميم أنيق والمواد عالية الجودة. اشتريت ثلاثة منتجات وكلها ممتازة.",
    author: "مريم حداد",
    handle: "@maryam_h",
    rating: 5,
    accentColor: "bg-secondary/10 text-secondary",
  },
  {
    quote: "خدمة عملاء ممتازة وسرعة في التوصيل. المنتجات تطابق الوصف تماماً.",
    author: "خالد العمري",
    handle: "@khaled_o",
    rating: 5,
    accentColor: "bg-accent/20 text-foreground",
  },
]

export function ReviewsSection() {
  return (
    <section className="py-16 sm:py-20 bg-muted/20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-10 text-center">
          <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase mb-2">
            آراء العملاء
          </p>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">ماذا يقول عملاؤنا</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {REVIEWS.map((review) => (
            <ReviewOne
              key={review.author}
              quote={review.quote}
              author={review.author}
              handle={review.handle}
              rating={review.rating}
              accentColor={review.accentColor}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
