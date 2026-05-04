/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Seed script for importing products from 24shopstar (old Converty store).
 *
 * Usage:
 *   node scripts/seed-24shopstar.cjs
 *
 * This script:
 *  1. Reads product data from scripts/scraped-products.json
 *  2. Creates/updates categories, products, variants, options & images
 *  3. Downloads product images from the old CDN and re-uploads to Cloudinary
 *     (falls back to external CDN URLs when Cloudinary is not configured)
 */

const path = require("path")
const fs = require("fs")
const https = require("https")
const http = require("http")

// Load .env.local first (Next.js convention), then fall back to .env
require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") })
require("dotenv").config({ path: path.join(__dirname, "..", ".env") })

const { PrismaClient } = require("@prisma/client")
const { PrismaPg } = require("@prisma/adapter-pg")
const pg = require("pg")
const cloudinary = require("cloudinary").v2

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL
if (!connectionString) {
  console.error("DATABASE_URL or DIRECT_URL is required for seeding")
  process.exit(1)
}

const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// ─── Cloudinary config ────────────────────────────────────────────────────────

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME?.trim(),
  api_key: process.env.CLOUDINARY_API_KEY?.trim(),
  api_secret: process.env.CLOUDINARY_API_SECRET?.trim(),
  secure: true,
})

let _cloudOk = false

/**
 * Download an image from a URL to a Buffer.
 */
function downloadToBuffer(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http
    client
      .get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const redirectUrl = res.headers.location.startsWith("http")
            ? res.headers.location
            : new URL(res.headers.location, url).href
          return downloadToBuffer(redirectUrl).then(resolve).catch(reject)
        }
        const chunks = []
        res.on("data", (c) => chunks.push(c))
        res.on("end", () => resolve(Buffer.concat(chunks)))
        res.on("error", reject)
      })
      .on("error", reject)
  })
}

/**
 * Upload an image buffer to Cloudinary and return the optimised URL.
 * Falls back to the original external URL on failure.
 */
async function uploadImageFromUrl(imageUrl, publicId) {
  if (!_cloudOk) return imageUrl

  try {
    const buffer = await downloadToBuffer(imageUrl)
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { public_id: publicId, overwrite: true, resource_type: "image" },
        (error, result) => {
          if (error) return reject(error)
          resolve(result)
        },
      )
      uploadStream.end(buffer)
    })

    // Return f_auto,q_auto URL for WebP/AVIF
    let optimized = result.secure_url
    if (optimized.includes("/upload/") && !optimized.includes("/upload/f_auto")) {
      optimized = optimized.replace("/upload/", "/upload/f_auto,q_auto/")
    }
    return optimized
  } catch (err) {
    console.error(`  ✗ Cloudinary upload failed for ${imageUrl}: ${err.message}`)
    return imageUrl
  }
}

// ─── Category mapping ─────────────────────────────────────────────────────────
// Map old slugs to our existing category handles

const CATEGORY_MAP = {
  // الإلكترونيات الذكية (Smart Electronics)
  "mini-camera-surveillance-wifi-full-hd-a9": ["smart-electronics"],
  "caps-lock": ["smart-electronics"],
  "super-chargeur-4-en-1-180w": ["smart-electronics"],
  "smaa-lqran-lkrym": ["smart-electronics"],
  // الصحة والجمال (Health & Beauty)
  "mwswaa-l-nf-lltnfws-laamyq-30-zwj": ["health-beauty"],
  "jhz-ltdlyk-rbaay-l-baad": ["health-beauty"],
  "mdrb-aadlt-lhwd-l-lmny": ["health-beauty"],
  "jhz-tmryn-aadlt-lhwd-wlfkhdhyn-srw-lqw-wljml": ["health-beauty"],
  "jhz-qys-ldgt-lrqmy": ["health-beauty"],
  "shrt-shd-lwjh-120-lsq": ["health-beauty"],
  "shmbw-rjn-llshyb": ["health-beauty"],
  // المنزل والمطبخ (Home & Kitchen)
  "mnfkh-hw-mhmwl-1": ["home-kitchen"],
  "mnfkh-hw-mhmwl": ["home-kitchen"],
  "mkyn-lkhyt-lydwy": ["home-kitchen"],
  "mkw-bkhr-mhmwl-sgyr-llmlbs-2-fy-1": ["home-kitchen"],
  "qtaa-lbtt-w-lkhdr-l-sly": ["home-kitchen"],
  "lavette-inox": ["home-kitchen"],
  "mthn-lthdyr-fdl-nwaa-lqhw-w-lbhrt-ltzj": ["home-kitchen"],
  "lmnzf-lrgwy": ["home-kitchen"],
  "hml-lgsl-wlthlj-lmdd-llrtaash-wlkhdwsh-x-4": ["home-kitchen"],
  "boite-a-bijoux-pliable-de-luxe-avec-miroir": ["home-kitchen"],
  // ألعاب الأطفال (Kids & Toys)
  "mrwhy-blthkm-aan-baad-1": ["kids-toys"],
  "jhz-laab-retro-game-stick": ["kids-toys"],
  "mrwhy-blthkm-aan-baad": ["kids-toys"],
}

// ─── Product description overrides ────────────────────────────────────────────
// The old site descriptions contain heavy HTML with external images that may break.
// We provide clean markdown descriptions instead.

const DESCRIPTION_OVERRIDES = {
  "mini-camera-surveillance-wifi-full-hd-a9": `## Mini Caméra Surveillance WIFI Full HD A9

كاميرا مراقبة صغيرة بتقنية WiFi بدقة كاملة Full HD A9.

### المميزات
- **تصوير بدقة Full HD** واضحة وحادة
- اتصال WiFi مباشر للمتابعة عن بعد
- رؤية ليلية بالأشعة تحت الحمراء
- كشف الحركة التلقائي
- تصميم صغير ومحمول
- مثالية لأمان المنزل والمكتب`,

  "mwswaa-l-nf-lltnfws-laamyq-30-zwj": `## موسّع الأنف للتنفّس العميق (30 زوج)

تقليل الشخير، والنوم بشكل أفضل، وتعزيز أداء التمرين.

### المميزات
- **إمداد لمدة 30 يومًا**: 30 شريطًا تكفي لمدة شهر كامل 🕜🗓
- لطيف على البشرة: مضاد للحساسية وجيد التهوية ✅
- مادة لاصقة مقاومة للعرق 🤐
- شريط يدوم لمدة تصل إلى 12-24 ساعة 👌`,

  "jhz-ltdlyk-rbaay-l-baad": `## جهاز مساج الرقبة والكتف والظهر الذكي

جهاز تدليك طبي رباعي الأبعاد يحاكي الماساج الحقيقي للتخلص من آلام العضلات.

### المميزات
- **تصميم مبتكر ومريح** للاستخدام في أي وقت ومكان
- وظيفة التسخين الذكي لتخفيف العضلات المتوترة
- تقنية التدليك بالشياتسو العميق
- تحكم في السرعة والاتجاه
- استخدام منزلي مريح
- **تحسين الحالة العامة للرقبة والكتف**`,

  "mnfkh-hw-mhmwl-1": `## منفاخ الهواء المحمول والأصلي ✅

منفاخ هواء محمول ومتعدد الاستخدامات للنفخ والتنظيف.

### المميزات
- **تصميم محمول** سهل الحمل والاستخدام
- قوة نفخ عالية
- شحن USB سريع
- مثالي لنفخ الإطارات والكرات والألعاب
- قابلية الشحن المتكررة`,

  "mnfkh-hw-mhmwl": `## منفاخ هواء محمول

منفاخ هواء محمول عملي ومتعدد الاستخدامات.

### المميزات
- **خفيف الوزن** وسهل الاستخدام
- قوة نفخ ممتازة
- شحن USB مريح
- مثالي للسفر والاستخدام اليومي`,

  "mkyn-lkhyt-lydwy": `## ماكينة الخياطة اليدوية

ماكينة خياطة يدوية محمولة لإصلاح الملابس بسرعة وسهولة.

### المميزات
- **تصميم محمول** صغير وخفيف
- سهلة الاستخدام للمبتدئين
- مثالية للإصلاحات السريعة
- تعمل بالبطاريات
- هدية مثالية للمبتدئين في الخياطة`,

  "caps-lock": `## قفل دراجة نارية ضد السرقة

قفل حديدي متين مضاد للسرقة للدراجات النارية.

### المميزات
- **قفل حديدي متين** ضد القص والكسر
- تصميم مقاوم للماء والصدأ
- مفتاح مزدوج للحماية المزدوجة
- طلاء مطاطي لحماية القرص
- مناسب لمعظم أنواع الدراجات النارية`,

  "mkw-bkhr-mhmwl-sgyr-llmlbs-2-fy-1": `## مكواة بخار محمولة صغيرة للملابس – 2 في 1

مكواة بخار صغيرة محمولة للملابس بتصميم 2 في 1.

### المميزات
- **تصميم 2 في 1**: مكواة جافة وبخار في جهاز واحد
- خفيفة الوزن ومحمولة
- تسخين سريع
- مثالية للسفر والاستخدام اليومي
- تزيل التجاعيد بسرعة وكفاءة`,

  "mdrb-aadlt-lhwd-l-lmny": `## 💪 جهاز تمارين عضلات الحوض والفخذين: سرّ القوة والجمال

جهاز تمارين لتقوية عضلات الحوض والفخذين.

### المميزات
- **تقوية عضلات الحوض والفخذين**
- تصميم مريح وسهل الاستخدام
- مقاومة قابلة للتعديل
- مناسب لجميع المستويات
- مثالي للتمارين المنزلية`,

  "jhz-tmryn-aadlt-lhwd-wlfkhdhyn-srw-lqw-wljml": `## جهاز كيجل للرجال حل مثالي لتقوية عضلات الخوض

جهاز كيجل للرجال لتقوية عضلات الحوض وتحسين الأداء.

### المميزات
- **تقوية عضلات الحوض** بشكل فعّال
- تصميم مريح وسري
- نتائج ملموسة في أسابيع
- مناسب لجميع المستويات
- سهل الاستخدام في المنزل`,

  "mrwhy-blthkm-aan-baad-1": `## مروحية بالتحكم عن بعد

مروحية رائعة بالتحكم عن بعد ممتعة للصغار والكبار.

### المميزات
- **تحكم عن بعد** سهل وسلس
- تصميم متين ومتاحر
- بطارية قابلة للشحن
- مثالية للعب في الداخل والخارج
- هدية رائعة للأطفال`,

  "super-chargeur-4-en-1-180w": `## Super Chargeur 4-en-1 180W

شاحن سوبر 4 في 1 بقدرة 180 واط لشحن جميع أجهزتك.

### المميزات
- **4 منافذ شحن** في جهاز واحد
- قدرة 180 واط لشحن سريع
- منفذ USB-C PD و USB-A
- حماية متكاملة من الحرارة والتيار
- مثالي للسفر والمكتب`,

  "smaa-lqran-lkrym": `## سماعة القرآن الكريم

سماعة القرآن الكريم المحمولة بتصميم أنيق وعملي.

### المميزات
- **القرآن الكريم كاملاً** بأصوات أشهر القرّاء
- أذكار وأدعية يومية
- سهلة الاستخدام بأزرار تحكم واضحة
- تصميم أنيق ومناسب للهدية
- هدية مباركة لكل بيت مسلم`,

  "jhz-qys-ldgt-lrqmy": `## جهاز قيس الضغط الرقمي

جهاز قياس ضغط الدم الرقمي بشاشة LED كبيرة وواضحة.

### المميزات
- **شاشة LED كبيرة وواضحة**
- يعرض الضغط الانقباضي والانبساطي ومعدل نبضات القلب
- نظام قياس ذكي بدقة عالية
- ذاكرة لتخزين القراءات السابقة
- سهل الاستخدام في المنزل`,

  "shrt-shd-lwjh-120-lsq": `## أشرطة شد الوجه (120 لاصق)

أشرطة شد الوجه للتجديد والحصول على مظهر أكثر شباباً.

### المميزات
- **120 لاصق** تكفي للاستخدام المطوّل
- فعّالة في شد الوجه والرقبة
- لطيفة على البشرة ومضادة للحساسية
- سهلة التطبيق والإزالة
- نتائج فورية ومُلاحظة`,

  "jhz-laab-retro-game-stick": `## جهاز ألعاب Retro Game Stick

جهاز ألعاب كلاسيكي يعمل عبر HDMI مع آلاف الألعاب المدمجة.

### ماذا تحصل؟
- جهاز **Game Stick** يعمل عبر HDMI
- يدّتا تحكم لاسلكيتان 2.4G
- دونجل USB للاتصال اللاسلكي
- كابل شحن + كابل تمديد HDMI
- دليل استعمال

### لمن هذا المنتج؟
- لعشّاق ألعاب Retro
- للعائلات واللعب الجماعي
- للهدايا وأعياد الميلاد`,

  "mrwhy-blthkm-aan-baad": `## مروحية بالتحكم عن بعد

مروحية بالتحكم عن بعد ممتعة وسهلة القيادة.

### المميزات
- **تحكم عن بعد** دقيق وسلس
- تصميم جميل ومتين
- بطارية قابلة للشحن
- مثالية للعب في الداخل والخارج
- مناسبة للأطفال والكبار`,

  "qtaa-lbtt-w-lkhdr-l-sly": `## قطاعة البطاطة و الخضر الأصلية

قطاعة بطاطة وخضر أصلية لتقطيع سريع وسهل.

### المميزات
- **تقطيع سريع وسهل** للبطاطا والخضر
- شفرات حادة من الستانلس ستيل
- تصميم آمن ومريح للاستخدام
- سهلة التنظيف
- مثالية لتحضير الوجبات بسرعة`,

  "lavette-inox": `## Lavette Inox

منظف ستانلس ستيل متعدد الاستخدامات لإزالة الأوساخ والبقع.

### المميزات
- **تنظيف فعّال** للستانلس ستيل والأسطح المعدنية
- تصميم مريح وسهل الاستخدام
- لا يخدش الأسطح
- مقاوم للصدأ والتآكل
- مثالي للمطبخ والمنزل`,

  "mthn-lthdyr-fdl-nwaa-lqhw-w-lbhrt-ltzj": `## 🥤 مطحنة 📢 لتحضير أفضل أنواع القهوة أو البهارات الطازجة🥜

مطحنة كهربائية لتحضير القهوة والبهارات الطازجة.

### المميزات
- **طحن سريع وفعّال** للقهوة والبهارات
- شفرات من الستانلس ستيل الحادة
- تصميم محمول وسهل التخزين
- تشغيل بضغطة واحدة
- مثالية لمحبي القهوة الطازجة`,

  "shmbw-rjn-llshyb": `## شامبو ارجان للشيب

شامبو بالأرجان لإخفاء الشيب وتلوين الشعر طبيعياً.

### المميزات
- **إخفاء الشيب** بشكل طبيعي تدريجي
- مكونات الأرغان المغذية
- مناسب لجميع أنواع الشعر
- نتائج ملموسة من أول استعمال
- خالي من المواد الكيميائية الضارة`,

  "lmnzf-lrgwy": `## المنظف الرغوي

بخاخ منظف رغوي لجميع الأغراض والتنظيف العميق.

### المميزات
- **منظف رغوي فعّال** لدهون المطبخ
- يزيل الشحوم والأوساخ العنيدة
- لطيف على اليدين
- عبوة 500 مل
- مثالي للتنظيف العميق`,

  "hml-lgsl-wlthlj-lmdd-llrtaash-wlkhdwsh-x-4": `## حامل الغسالة والثلاجة المضاد للإرتعاش والخدوش x 4

حامل مضاد للإرتعاش والخدوش للغسالة والثلاجة.

### المميزات
- **4 قواعد مضادة للإرتعاش**
- حماية الأرضية من الخدوش
- تقليل الاهتزاز والضوضاء
- تصميم متين ومتاحر
- سهل التركيب`,

  "boite-a-bijoux-pliable-de-luxe-avec-miroir": `## Boîte à bijoux pliable de luxe avec miroir 😍

صندوق مجوهرات فاخر قابل للطي مع مرآة مدمجة.

### المميزات
- **تصميم فاخر** قابل للطي مع مرآة مدمجة
- تقسيمات داخلية متعددة لتنظيم المجوهرات
- جلد صناعي عالي الجودة
- هدية مثالية للنساء والفتيات
- مناسب للسفر والاستخدام اليومي`,
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Starting 24shopstar product import...\n")

  // ── Validate Cloudinary config ──────────────────────────────────────────────
  _cloudOk = !!(
    process.env.CLOUDINARY_CLOUD_NAME?.trim() &&
    process.env.CLOUDINARY_API_KEY?.trim() &&
    process.env.CLOUDINARY_API_SECRET?.trim()
  )
  if (_cloudOk) {
    console.log("✓ Cloudinary configured — images will be re-uploaded")
  } else {
    console.warn("⚠  Cloudinary env vars missing — external CDN URLs will be used as-is")
  }

  // ── Read scraped data ──────────────────────────────────────────────────────
  const scrapedPath = path.join(__dirname, "scraped-products.json")
  if (!fs.existsSync(scrapedPath)) {
    console.error(`✗ Scraped data file not found: ${scrapedPath}`)
    console.error("  Run: node scripts/scrape-24shopstar.cjs first")
    process.exit(1)
  }
  const scrapedProducts = JSON.parse(fs.readFileSync(scrapedPath, "utf8"))
  console.log(`✓ Loaded ${scrapedProducts.length} products from scraped data\n`)

  // ── Get or create categories ────────────────────────────────────────────────
  const categoryHandles = [
    { name: "الإلكترونيات الذكية", handle: "smart-electronics" },
    { name: "الصحة والجمال", handle: "health-beauty" },
    { name: "المنزل والمطبخ", handle: "home-kitchen" },
    { name: "ألعاب الأطفال", handle: "kids-toys" },
  ]

  const catMap = {}
  for (const cat of categoryHandles) {
    const record = await prisma.category.upsert({
      where: { handle: cat.handle },
      update: { name: cat.name },
      create: { name: cat.name, handle: cat.handle },
    })
    catMap[cat.handle] = record
  }
  console.log("✓ Categories ensured")

  // ── Import products ─────────────────────────────────────────────────────────
  let created = 0
  let skipped = 0

  for (const p of scrapedProducts) {
    const existingProduct = await prisma.product.findUnique({
      where: { handle: p.slug },
    })
    if (existingProduct) {
      console.log(`  ⊘ Skipped (already exists): ${p.name}`)
      skipped++
      continue
    }

    // Determine categories
    const catHandles = CATEGORY_MAP[p.slug] || ["home-kitchen"]
    const categories = catHandles.map((h) => ({ id: catMap[h].id }))

    // Determine description (use override or strip HTML)
    const description = DESCRIPTION_OVERRIDES[p.slug] || p.description || ""

    // Build variants
    const variants = []

    if (p.newVariants && p.newVariants.length > 0) {
      // Product has variants/options
      for (const nv of p.newVariants) {
        const variantTitle = nv.selectedValues.join(" + ")
        const sku = `24S-${p.slug.substring(0, 20).toUpperCase().replace(/-/g, "")}-${nv.id.replace("variant-", "").substring(0, 6)}`
        const options = []
        if (p.options && p.options.length > 0) {
          for (const opt of p.options) {
            for (let i = 0; i < opt.values.length; i++) {
              if (nv.selectedValues.includes(opt.values[i].value)) {
                options.push({
                  name: opt.name,
                  value: opt.values[i].value,
                })
              }
            }
          }
        }

        variants.push({
          title: variantTitle,
          sku,
          price: nv.price || p.price,
          inventory: nv.stock?.outOfStock ? 0 : 50,
          options: { create: options },
        })
      }
    } else {
      // Simple product — single default variant
      const sku = `24S-${p.slug.substring(0, 24).toUpperCase().replace(/-/g, "")}`
      variants.push({
        title: "الافتراضي",
        sku,
        price: p.price,
        inventory: 50,
      })
    }

    // Create product
    const product = await prisma.product.create({
      data: {
        title: p.name,
        handle: p.slug,
        description,
        status: "published",
        adsBoosted: false,
        categories: { connect: categories },
        variants: { create: variants },
      },
    })

    // Create product images
    if (p.images && p.images.length > 0) {
      for (let i = 0; i < p.images.length; i++) {
        let imageUrl = p.images[i]

        if (_cloudOk) {
          const publicId = `taktak/24shopstar/${p.slug}-${i}`
          process.stdout.write(`    ↑ Uploading image ${i + 1}/${p.images.length}... `)
          const uploadedUrl = await uploadImageFromUrl(imageUrl, publicId)
          if (uploadedUrl !== imageUrl) {
            imageUrl = uploadedUrl
            console.log("✓")
          } else {
            console.log("→ using external URL")
          }
        }

        await prisma.productImage.create({
          data: {
            productId: product.id,
            url: imageUrl,
            alt: p.name,
            sortOrder: i,
          },
        })
      }
    }

    created++
    console.log(`  + ${p.name} (${variants.length} variant${variants.length > 1 ? "s" : ""}) [${catHandles.join(", ")}]`)
  }

  console.log(`\n✅ Import complete!`)
  console.log(`   Created: ${created}`)
  console.log(`   Skipped (already exist): ${skipped}`)
  if (!_cloudOk) {
    console.log("\nℹ  Cloudinary not configured — images reference external CDN URLs.")
    console.log("   To migrate images, configure Cloudinary and re-run this script.")
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
