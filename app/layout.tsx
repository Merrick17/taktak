import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Providers } from "./providers";
import { StorefrontChrome } from "@/components/layout/storefront-chrome";
import { Footer } from "@/components/layout/footer";
import { MetaPixelRoot } from "@/components/analytics/meta-pixel";
import type { AppCategory } from "@/lib/types";

async function getFooterCategories(): Promise<AppCategory[]> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/categories`,
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function getSocialSettings(): Promise<Record<string, string>> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/settings`,
      { next: { revalidate: 600 } },
    );
    if (!res.ok) return {};
    return res.json();
  } catch {
    return {};
  }
}

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-sans",
  display: "swap",
});

export const revalidate = 3600;

const rootTitle = "تكتك — أساسيات عصرية";
const rootDescription =
  "منتجات مختارة بعناية للحياة العصرية. جودة عالية وتصميم بسيط.";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://taktakstore.com",
  ),
  title: rootTitle,
  description: rootDescription,
  icons: {
    icon: [{ url: "/icon", type: "image/png", sizes: "512x512" }],
    apple: [{ url: "/apple-icon", type: "image/png", sizes: "180x180" }],
  },
  openGraph: {
    type: "website",
    siteName: "تكتك",
    locale: "ar_AR",
    alternateLocale: ["fr_FR"],
    url: "/",
    title: rootTitle,
    description: rootDescription,
    images: [{ url: "/assets/taktak_logo.png", alt: "تكتك" }],
  },
  twitter: {
    card: "summary_large_image",
    title: rootTitle,
    description: rootDescription,
    images: ["/assets/taktak_logo.png"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [footerCategories, socialSettings] = await Promise.all([
    getFooterCategories(),
    getSocialSettings(),
  ]);

  const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "";

  return (
    <html
      lang="ar"
      dir="rtl"
      className={cn("h-full antialiased", cairo.variable, "font-sans")}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          <MetaPixelRoot pixelId={metaPixelId} />
          <StorefrontChrome
            footerCategories={footerCategories}
            socialSettings={socialSettings}
          />
          <main className="flex flex-1 flex-col">{children}</main>
          <Footer categories={footerCategories} socialSettings={socialSettings} />
        </Providers>
      </body>
    </html>
  );
}
