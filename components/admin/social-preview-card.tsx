"use client"

import { useState } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { formatPrice } from "@/lib/types"

interface SocialPreviewCardProps {
  title: string
  description: string
  image?: string | null
  price?: number
  handle?: string
  siteName?: string
}

type Platform = "facebook" | "instagram" | "tiktok"

const PLATFORMS: { id: Platform; label: string; icon: React.ReactNode }[] = [
  {
    id: "facebook",
    label: "Facebook",
    icon: (
      <svg viewBox="0 0 24 24" className="size-4 fill-[#1877F2]">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    id: "instagram",
    label: "Instagram",
    icon: (
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="url(#ig-gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <defs>
          <linearGradient id="ig-gradient" x1="0" y1="24" x2="24" y2="0">
            <stop offset="0%" stopColor="#FD5" />
            <stop offset="50%" stopColor="#F56040" />
            <stop offset="100%" stopColor="#C13584" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <circle cx="12" cy="12" r="5.5" />
        <circle cx="17.5" cy="6.5" r="1.5" fill="url(#ig-gradient)" stroke="none" />
      </svg>
    ),
  },
  {
    id: "tiktok",
    label: "TikTok",
    icon: (
      <svg viewBox="0 0 24 24" className="size-4">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.46V13a8.28 8.28 0 005.58 2.17V11.7a4.83 4.83 0 01-3.77-1.76V6.69h3.77z" fill="#000" />
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.46V13a8.28 8.28 0 005.58 2.17V11.7a4.83 4.83 0 01-3.77-1.76V6.69h3.77z" fill="none" stroke="#25F4EE" strokeWidth="1" transform="translate(-0.5,-0.5)" />
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.46V13a8.28 8.28 0 005.58 2.17V11.7a4.83 4.83 0 01-3.77-1.76V6.69h3.77z" fill="none" stroke="#FE2C55" strokeWidth="1" transform="translate(0.5,0.5)" />
      </svg>
    ),
  },
]

function FacebookPreview({
  title,
  description,
  image,
  siteName,
  price,
}: SocialPreviewCardProps) {
  return (
    <div className="rounded-lg overflow-hidden border border-gray-300 bg-white max-w-[500px]">
      {/* Image */}
      <div className="relative aspect-[1.91/1] bg-gray-100">
        {image ? (
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover"
            sizes="500px"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-xs">
            لا توجد صورة
          </div>
        )}
        {price !== undefined && price > 0 && (
          <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs font-bold px-2 py-1 rounded">
            {formatPrice(price)}
          </div>
        )}
      </div>
      {/* Info */}
      <div className="p-3 bg-[#f0f2f5] border-t border-gray-300">
        <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-0.5">
          {siteName ?? "taktakstore.com"}
        </p>
        <p className="text-sm font-semibold text-[#1d2129] leading-snug line-clamp-2 mb-0.5">
          {title || "عنوان المنتج"}
        </p>
        <p className="text-xs text-gray-500 line-clamp-2">
          {description || "وصف المنتج سيظهر هنا..."}
        </p>
      </div>
    </div>
  )
}

function InstagramPreview({
  title,
  description,
  image,
  price,
  handle,
}: SocialPreviewCardProps) {
  return (
    <div className="rounded-lg overflow-hidden border border-gray-300 bg-white max-w-[400px]">
      {/* Header */}
      <div className="flex items-center gap-2 p-3">
        <div className="size-8 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 p-[2px]">
          <div className="size-full rounded-full bg-white p-[1.5px]">
            <div className="size-full rounded-full bg-gray-200" />
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-900">taktakstore</p>
          <p className="text-[10px] text-gray-500">مُوصى به</p>
        </div>
      </div>
      {/* Image */}
      <div className="relative aspect-square bg-gray-100">
        {image ? (
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover"
            sizes="400px"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-xs">
            لا توجد صورة
          </div>
        )}
        {price !== undefined && price > 0 && (
          <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur text-gray-900 text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
            {formatPrice(price)}
          </div>
        )}
      </div>
      {/* Footer */}
      <div className="p-3">
        <p className="text-xs font-semibold text-gray-900 mb-1 line-clamp-1">
          taktakstore
        </p>
        <p className="text-xs text-gray-700 line-clamp-2 leading-relaxed">
          {title || "عنوان المنتج"}
          {description && (
            <span className="text-gray-500"> — {description.slice(0, 80)}</span>
          )}
        </p>
        <p className="text-[10px] text-gray-400 mt-1">
          {`taktakstore.com${handle ? `/products/${handle}` : ""}`}
        </p>
      </div>
    </div>
  )
}

function TikTokPreview({
  title,
  description,
  image,
  price,
  handle,
}: SocialPreviewCardProps) {
  return (
    <div className="rounded-lg overflow-hidden border border-gray-300 bg-[#121212] max-w-[340px] text-white">
      {/* Video/Image area */}
      <div className="relative aspect-[9/16] bg-gray-900 max-h-[300px]">
        {image ? (
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover"
            sizes="340px"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-600 text-xs">
            لا توجد صورة
          </div>
        )}
        {/* Bottom overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
          <p className="text-xs font-bold leading-snug line-clamp-2">
            {title || "عنوان المنتج"}
          </p>
          {price !== undefined && price > 0 && (
            <p className="text-xs font-bold text-[#FE2C55] mt-1">
              {formatPrice(price)}
            </p>
          )}
          <p className="text-[10px] text-gray-400 mt-1 line-clamp-1">
            {description ? description.slice(0, 60) : "وصف المنتج..."}
          </p>
        </div>
        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="size-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="size-5 fill-white ml-0.5">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </div>
      {/* Footer info */}
      <div className="flex items-center gap-2 p-3">
        <div className="size-8 rounded-full bg-gray-700 shrink-0" />
        <div className="min-w-0">
          <p className="text-xs font-bold truncate">taktakstore</p>
          <p className="text-[10px] text-gray-500 truncate">
            {`taktakstore.com${handle ? `/products/${handle}` : ""}`}
          </p>
        </div>
        <div className="shrink-0 mr-auto">
          <span className="inline-block text-[10px] font-bold border border-[#FE2C55] text-[#FE2C55] px-3 py-1 rounded-sm">
            عرض المنتج
          </span>
        </div>
      </div>
    </div>
  )
}

export function SocialPreviewCard({
  title,
  description,
  image,
  price,
  handle,
  siteName,
}: SocialPreviewCardProps) {
  const [platform, setPlatform] = useState<Platform>("facebook")

  return (
    <div className="space-y-3">
      {/* Platform selector tabs */}
      <div className="flex gap-1 p-1 rounded-lg bg-muted/50">
        {PLATFORMS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPlatform(p.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
              platform === p.id
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {p.icon}
            {p.label}
          </button>
        ))}
      </div>

      {/* Preview area */}
      <div className="flex justify-center p-4 rounded-lg bg-muted/30 border border-border min-h-[200px]">
        {platform === "facebook" && (
          <FacebookPreview
            title={title}
            description={description}
            image={image}
            price={price}
            handle={handle}
            siteName={siteName}
          />
        )}
        {platform === "instagram" && (
          <InstagramPreview
            title={title}
            description={description}
            image={image}
            price={price}
            handle={handle}
            siteName={siteName}
          />
        )}
        {platform === "tiktok" && (
          <TikTokPreview
            title={title}
            description={description}
            image={image}
            price={price}
            handle={handle}
            siteName={siteName}
          />
        )}
      </div>

      {/* Tip */}
      <p className="text-[11px] text-muted-foreground leading-relaxed">
        هذا عرض تقريبي لكيفية ظهور المنتج عند مشاركته. المنصات قد تغيّر الشكل النهائي.
        {price !== undefined && price > 0 && (
          <span className="block mt-0.5">
            💡 السعر وتوفر المنتج يظهران تلقائياً في بطاقة المنتج بفضل Open Graph.
          </span>
        )}
      </p>
    </div>
  )
}
