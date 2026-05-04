"use client"

import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface PromoBannerOneProps {
  message?: string
  link?: string
  linkText?: string
  backgroundColor?: string
  textColor?: string
  isDismissible?: boolean
}

export function PromoBannerOne({
  message = "🎉 احصل على خصم 20% على طلبك الأول بالكود WELCOME20",
  link = "/products",
  linkText = "تسوق الآن",
  backgroundColor = "bg-primary",
  textColor = "text-primary-foreground",
  isDismissible = true,
}: PromoBannerOneProps) {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  return (
    <div
      className={cn(
        "relative flex items-center justify-center px-4 py-2.5",
        backgroundColor,
        textColor
      )}
    >
      <div className="flex items-center justify-center gap-2 text-sm font-medium flex-wrap text-center">
        <span>{message}</span>
        {link && (
          <a
            href={link}
            className="underline underline-offset-4 hover:no-underline font-semibold"
          >
            {linkText}
          </a>
        )}
      </div>

      {isDismissible && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute end-2 top-1/2 -translate-y-1/2 h-7 w-7 hover:bg-primary-foreground/10"
          onClick={() => setIsVisible(false)}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  )
}