import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import { openGraphImageUrl } from "@/lib/og-image";
import { serializeAppProduct } from "@/lib/product-serialize";
import { productIncludeForApi } from "@/lib/product-serialize";
import ProductDetail from "./_components/product-detail";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://taktakstore.com";
const STORE_NAME = "تكتك";

interface Props {
  params: Promise<{ handle: string }>;
}

async function getProduct(handle: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { handle },
      include: productIncludeForApi,
    });
    if (!product) return null;
    return serializeAppProduct(product);
  } catch {
    return null;
  }
}

/** Strip markdown syntax to plain text for meta description */
function stripMarkdown(md: string): string {
  return md
    .replace(/!\[.*?\]\(.*?\)/g, "") // images
    .replace(/\[([^\]]+)\]\(.*?\)/g, "$1") // links
    .replace(/#{1,6}\s?/g, "") // headings
    .replace(/(\*\*|__)(.*?)\1/g, "$2") // bold
    .replace(/(\*|_)(.*?)\1/g, "$2") // italic
    .replace(/`{1,3}[^`]*`{1,3}/g, "") // code
    .replace(/>\s?/g, "") // blockquotes
    .replace(/[-*+]\s/g, "") // list items
    .replace(/\n+/g, " ") // newlines → space
    .trim()
    .slice(0, 160);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const product = await getProduct(handle);

  if (!product) {
    return { title: `المنتج غير موجود — ${STORE_NAME}` };
  }

  const title = `${product.title} — ${STORE_NAME}`;
  const rawDescription = product.description
    ? stripMarkdown(product.description)
    : `اشترِ ${product.title} بأفضل سعر في تونس. توصيل لكامل الجمهورية.`;

  const rawImage = product.images?.[0]?.url ?? product.thumbnail ?? null;
  const ogImage = openGraphImageUrl(rawImage, { baseUrl: APP_URL });
  const url = `${APP_URL}/products/${handle}`;

  return {
    title,
    description: rawDescription,
    openGraph: {
      type: "website",
      url,
      siteName: STORE_NAME,
      locale: "ar_AR",
      alternateLocale: ["fr_FR"],
      title,
      description: rawDescription,
      ...(ogImage
        ? {
            images: [
              {
                url: ogImage,
                width: 1200,
                height: 630,
                alt: product.title,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: rawDescription,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
    alternates: {
      canonical: url,
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { handle } = await params;
  const product = await getProduct(handle);

  // Build JSON-LD structured data for Google, Facebook, TikTok & Instagram
  const jsonLd = product
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.title,
        description: product.description
          ? stripMarkdown(product.description)
          : undefined,
        image: product.images?.map((img) => img.url) ?? [],
        sku: product.variants?.[0]?.sku ?? undefined,
        offers: {
          "@type": "Offer",
          url: `${APP_URL}/products/${handle}`,
          priceCurrency: "TND",
          price: product.variants?.[0]?.price ?? 0,
          availability: product.variants?.some((v) => v.inventory > 0)
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
          seller: {
            "@type": "Organization",
            name: STORE_NAME,
          },
        },
        brand: {
          "@type": "Brand",
          name: STORE_NAME,
        },
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ProductDetail />
    </>
  );
}
