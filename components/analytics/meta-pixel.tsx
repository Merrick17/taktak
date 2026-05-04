"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import Script from "next/script"
import { trackMetaPageView } from "@/lib/meta-pixel-client"

interface MetaPixelRootProps {
  pixelId: string
}

export function MetaPixelRoot({ pixelId }: MetaPixelRootProps) {
  const pathname = usePathname()
  const prevPath = useRef<string | null>(null)
  const trimmed = pixelId.replace(/\D/g, "")

  useEffect(() => {
    if (!trimmed) return
    if (prevPath.current === null) {
      prevPath.current = pathname
      return
    }
    if (prevPath.current !== pathname) {
      prevPath.current = pathname
      trackMetaPageView()
    }
  }, [pathname, trimmed])

  if (!trimmed) return null

  const inline = `
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${trimmed}');
fbq('track','PageView');
  `.trim()

  return (
    <Script id="meta-pixel" strategy="afterInteractive">
      {inline}
    </Script>
  )
}
