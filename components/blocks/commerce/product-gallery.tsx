"use client"

import { useState } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface GalleryImage {
  url: string
  alt?: string
}

interface ProductGalleryProps {
  images: GalleryImage[]
  title: string
}

export function ProductGallery({ images, title }: ProductGalleryProps) {
  const safeImages = (images ?? []).filter((img) => !!img.url)
  const [activeIndex, setActiveIndex] = useState(0)

  if (!safeImages.length) return <div className="aspect-square w-full rounded-2xl bg-muted" />

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-muted">
        <Image
          src={safeImages[activeIndex].url}
          alt={title}
          fill
          priority
          className="object-cover transition-opacity duration-300"
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
      </div>

      {safeImages.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {safeImages.map((image, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={cn(
                "relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted ring-1 transition-all",
                index === activeIndex ? "ring-foreground ring-offset-2" : "ring-border hover:ring-foreground/40"
              )}
            >
              <Image src={image.url} alt={`${title} ${index + 1}`} fill className="object-cover" sizes="64px" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
