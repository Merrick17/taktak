import type { NextConfig } from "next"
import { dirname } from "path"
import { fileURLToPath } from "url"

const nextConfig: NextConfig = {
  serverExternalPackages: ["pg", "@prisma/adapter-pg"],
  async rewrites() {
    return [{ source: "/favicon.ico", destination: "/icon" }]
  },
  turbopack: {
    root: dirname(fileURLToPath(import.meta.url)),
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },
      { protocol: "https", hostname: "images.unsplash.com" },
      ...(process.env.NODE_ENV === "development"
        ? [
            { protocol: "http" as const, hostname: "localhost", port: "9000", pathname: "/**" },
            { protocol: "http" as const, hostname: "127.0.0.1", port: "9000", pathname: "/**" },
          ]
        : []),
    ],
  },
}

export default nextConfig
