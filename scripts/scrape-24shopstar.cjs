/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Scrape script for fetching product data from 24shopstar (old Converty store).
 *
 * Usage:
 *   node scripts/scrape-24shopstar.cjs
 *
 * This script:
 *  1. Fetches the main page to discover all product slugs
 *  2. For each product slug, fetches the product page and extracts
 *     the embedded JSON data (name, price, comparePrice, description, images, variants, etc.)
 *  3. Saves the collected data to scripts/scraped-products.json
 */

const https = require("https")
const http = require("http")
const fs = require("fs")
const path = require("path")

const BASE_URL = "https://24shopstar.converty.shop"
const OUTPUT_PATH = path.join(__dirname, "scraped-products.json")

// ─── HTTP helpers ──────────────────────────────────────────────────────────────

function fetchText(url, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout fetching ${url}`)), timeout)
    const client = url.startsWith("https") ? https : http

    client
      .get(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; Scraper/1.0)" } }, (res) => {
        // Handle redirects (301, 302, 307, 308)
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const redirectUrl = res.headers.location.startsWith("http")
            ? res.headers.location
            : new URL(res.headers.location, url).href
          clearTimeout(timer)
          fetchText(redirectUrl, timeout).then(resolve).catch(reject)
          return
        }

        if (res.statusCode < 200 || res.statusCode >= 400) {
          clearTimeout(timer)
          reject(new Error(`HTTP ${res.statusCode} for ${url}`))
          return
        }

        const chunks = []
        res.on("data", (c) => chunks.push(c))
        res.on("end", () => {
          clearTimeout(timer)
          resolve(Buffer.concat(chunks).toString("utf8"))
        })
        res.on("error", (err) => {
          clearTimeout(timer)
          reject(err)
        })
      })
      .on("error", (err) => {
        clearTimeout(timer)
        reject(err)
      })
  })
}

// ─── Extract product slugs from the homepage ──────────────────────────────────

function extractProductSlugs(html) {
  const slugSet = new Set()
  // Match href="/product/..." links from the homepage product cards
  const regex = /href="\/product\/([^"?#]+)"/g
  let match
  while ((match = regex.exec(html)) !== null) {
    slugSet.add(match[1])
  }
  return Array.from(slugSet)
}

// ─── Extract product data JSON from a product page ─────────────────────────────

function extractProductData(html) {
  // The product data is embedded as <script id="productData" type="application/json">{...}</script>
  const match = html.match(/id="productData"\s+type="application\/json">([\s\S]*?)<\/script>/)
  if (!match) return null

  try {
    return JSON.parse(match[1])
  } catch (err) {
    console.error("  ✗ Failed to parse product JSON:", err.message)
    return null
  }
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🔍 Scraping 24shopstar product data...\n")
  console.log(`  Store URL: ${BASE_URL}`)

  // ── Step 1: Fetch homepage to discover product slugs ────────────────────────
  console.log("\n📡 Fetching homepage to discover product slugs...")
  let homepageHtml
  try {
    homepageHtml = await fetchText(BASE_URL)
  } catch (err) {
    console.error(`✗ Failed to fetch homepage: ${err.message}`)
    console.error("  Please check that the store URL is accessible and try again.")
    process.exit(1)
  }

  const discoveredSlugs = extractProductSlugs(homepageHtml)
  console.log(`  Found ${discoveredSlugs.length} product slugs on the homepage`)

  // Also include the known slugs from the original HTML snippet as fallback
  const knownSlugs = [
    "mini-camera-surveillance-wifi-full-hd-a9",
    "mwswaa-l-nf-lltnfws-laamyq-30-zwj",
    "jhz-ltdlyk-rbaay-l-baad",
    "mnfkh-hw-mhmwl-1",
    "mnfkh-hw-mhmwl",
    "mkyn-lkhyt-lydwy",
    "caps-lock",
    "mkw-bkhr-mhmwl-sgyr-llmlbs-2-fy-1",
    "mdrb-aadlt-lhwd-l-lmny",
    "jhz-tmryn-aadlt-lhwd-wlfkhdhyn-srw-lqw-wljml",
    "mrwhy-blthkm-aan-baad-1",
    "super-chargeur-4-en-1-180w",
    "smaa-lqran-lkrym",
    "jhz-qys-ldgt-lrqmy",
    "shrt-shd-lwjh-120-lsq",
    "jhz-laab-retro-game-stick",
    "mrwhy-blthkm-aan-baad",
    "qtaa-lbtt-w-lkhdr-l-sly",
    "lavette-inox",
    "mthn-lthdyr-fdl-nwaa-lqhw-w-lbhrt-ltzj",
    "shmbw-rjn-llshyb",
    "lmnzf-lrgwy",
    "hml-lgsl-wlthlj-lmdd-llrtaash-wlkhdwsh-x-4",
    "boite-a-bijoux-pliable-de-luxe-avec-miroir",
  ]

  // Merge discovered and known slugs (deduplicated)
  const allSlugs = [...new Set([...discoveredSlugs, ...knownSlugs])]
  console.log(`  Total unique slugs to scrape: ${allSlugs.length}`)

  // ── Step 2: Fetch each product page and extract data ────────────────────────
  const products = []
  const errors = []

  for (let i = 0; i < allSlugs.length; i++) {
    const slug = allSlugs[i]
    const url = `${BASE_URL}/product/${slug}`
    process.stdout.write(`  [${i + 1}/${allSlugs.length}] ${slug}... `)

    try {
      const html = await fetchText(url)
      const productData = extractProductData(html)

      if (!productData) {
        console.log("✗ (no productData found)")
        errors.push({ slug, error: "No productData found in page" })
        continue
      }

      // Extract the fields we need for seeding
      const product = {
        name: productData.name || slug,
        slug: productData.slug || slug,
        price: productData.price ?? 0,
        comparePrice: productData.comparePrice ?? 0,
        deliveryPrice: productData.deliveryPrice ?? 0,
        description: productData.description || "",
        images: (productData.images || []).map((img) => img.lg || img.md || img.sm || ""),
        variants: (productData.variants || []).map((v) => ({
          name: v.name || "",
          type: v.type || "",
          values: Array.isArray(v.values) ? v.values.map((val) => val || "") : [],
          image: v.image || null,
        })),
        newVariants: (productData.newVariants || []).map((nv) => ({
          id: nv.id || "",
          selectedValues: nv.selectedValues || [],
          default: nv.default || false,
          variantKey: nv.variantKey || "",
          sku: nv.sku || "",
          barcode: nv.barcode || "",
          image: nv.image || "",
          deliveryPrice: nv.deliveryPrice ?? 0,
          comparePrice: nv.comparePrice ?? 0,
          price: nv.price ?? 0,
          cost: nv.cost ?? 0,
          stock: {
            outOfStock: nv.stock?.outOfStock ?? false,
            continueSellingWhenOutOfStock: nv.stock?.continueSellingWhenOutOfStock ?? true,
          },
        })),
        options: (productData.options || []).map((opt) => ({
          id: opt.id || "",
          name: opt.name || "",
          type: opt.type || "",
          values: (opt.values || []).map((val) => ({
            id: val.id || "",
            value: val.value || "",
          })),
        })),
        status: productData.status || "shown",
        categories: productData.categories || [],
      }

      // Filter out empty image URLs
      product.images = product.images.filter((url) => url && url.length > 0)

      products.push(product)
      console.log(`✓ (${product.images.length} images, ${product.newVariants.length} variants)`)
    } catch (err) {
      console.log(`✗ (${err.message})`)
      errors.push({ slug, error: err.message })
    }

    // Small delay to be respectful to the server
    if (i < allSlugs.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 300))
    }
  }

  // ── Step 3: Save results ────────────────────────────────────────────────────
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(products, null, 2), "utf8")

  console.log(`\n✅ Scraping complete!`)
  console.log(`   Products scraped: ${products.length}`)
  console.log(`   Errors: ${errors.length}`)
  console.log(`   Output: ${OUTPUT_PATH}`)

  if (errors.length > 0) {
    console.log("\n⚠️  Failed slugs:")
    for (const e of errors) {
      console.log(`   - ${e.slug}: ${e.error}`)
    }
  }

  // Print a summary table
  console.log("\n📊 Product Summary:")
  console.log("─".repeat(80))
  for (const p of products) {
    const hasVariants = p.newVariants.length > 0
    const priceStr = hasVariants
      ? p.newVariants.map((v) => `${v.price} DT`).join(" / ")
      : `${p.price} DT`
    const compareStr = p.comparePrice ? `(was ${p.comparePrice} DT)` : ""
    console.log(
      `  ${p.name.substring(0, 50).padEnd(50)} | ${priceStr.padEnd(15)} | ${p.images.length} img${hasVariants ? ` | ${p.newVariants.length} var` : ""}`,
    )
  }
  console.log("─".repeat(80))
}

main().catch((err) => {
  console.error("Fatal error:", err)
  process.exit(1)
})
