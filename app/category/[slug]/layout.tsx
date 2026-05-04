import type { Metadata } from "next"
import prisma from "@/lib/prisma"
import { defaultOgImageAbsolute, openGraphImageUrl } from "@/lib/og-image"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://taktakstore.com"
const STORE_NAME = process.env.NEXT_PUBLIC_STORE_NAME ?? "تكتك"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params

  const category = await prisma.category
    .findUnique({
      where: { handle: slug },
      select: { name: true, handle: true, image: true },
    })
    .catch(() => null)

  if (!category) {
    return { title: `تسوق — ${STORE_NAME}` }
  }

  const title = `${category.name} — ${STORE_NAME}`
  const description = `تصفح منتجات ${category.name} في ${STORE_NAME}`
  const url = `${APP_URL}/category/${slug}`
  const ogImage =
    openGraphImageUrl(category.image, { baseUrl: APP_URL }) ?? defaultOgImageAbsolute(APP_URL)

  return {
    title,
    description,
    openGraph: {
      type: "website",
      url,
      siteName: STORE_NAME,
      locale: "ar_AR",
      alternateLocale: ["fr_FR"],
      title,
      description,
      images: [{ url: ogImage, alt: category.name }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    alternates: { canonical: url },
  }
}

export default function CategoryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
