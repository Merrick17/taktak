/* eslint-disable @typescript-eslint/no-require-imports */
const path = require("path")
// Load .env.local first (Next.js convention), then fall back to .env
require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") })
require("dotenv").config({ path: path.join(__dirname, "..", ".env") })
const { PrismaClient } = require("@prisma/client")
const { PrismaPg } = require("@prisma/adapter-pg")
const pg = require("pg")
const bcrypt = require("bcryptjs")
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
  api_key:    process.env.CLOUDINARY_API_KEY?.trim(),
  api_secret: process.env.CLOUDINARY_API_SECRET?.trim(),
  secure: true,
})

const ASSETS_DIR = path.join(__dirname, "..", "public", "assets")

/**
 * Transform a raw Cloudinary secure_url to include f_auto,q_auto so the CDN
 * serves WebP/AVIF instead of the raw uploaded PNG.
 * This URL is stored directly in the DB — no runtime transformation needed.
 */
function cloudinaryOptimizeUrl(url) {
  if (!url || !url.includes("res.cloudinary.com")) return url
  if (url.includes("/upload/f_auto")) return url
  return url.replace("/upload/", "/upload/f_auto,q_auto/")
}

let _cloudOk = false

async function uploadImage(relativePath, publicId) {
  const filePath = path.join(ASSETS_DIR, relativePath)

  if (!_cloudOk) {
    // Fallback: use local public path when Cloudinary is not configured
    return `/assets/${relativePath}`
  }

  // Force re-upload to ensure we always get a fresh, valid URL
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      public_id: publicId,
      overwrite: true,
      resource_type: "image",
    })
    return cloudinaryOptimizeUrl(result.secure_url)
  } catch (err) {
    console.error(`  ✗ Upload failed for ${relativePath}: ${err.message}`)
    // Fallback to local path on upload failure
    return `/assets/${relativePath}`
  }
}

// ─── Image maps ───────────────────────────────────────────────────────────────

const CATEGORY_IMAGE_MAP = {
  "smart-electronics": "categories/cat_smart_electronics.png",
  "health-beauty":     "categories/cat_health_beauty.png",
  "home-kitchen":      "categories/cat_home_kitchen.png",
  "kids-toys":         "categories/cat_kids_toys.png",
}

const PRODUCT_IMAGE_MAP = {
  "wifi-panorama-camera":           "products/03_wifi_panorama_camera.png",
  "mini-wifi-camera-128gb":         "products/09_mini_wifi_camera.png",
  "wireless-game-console-m15-plus": "products/12_wireless_game_console.png",
  "smart-quran-speaker":            "products/11_quran_speaker.png",
  "starry-night-projector":         "products/10_starry_projector_light.png",
  "massage-gun-pro-4colors":        "products/05_massage_gun_colors.png",
  "massage-gun-compact-silver":     "products/05_massage_gun_colors.png",
  "dahan-bilsan-pain-gel":          "products/07_dahan_bilsan_gel.png",
  "dr-rashel-sunscreen-spf100":     "products/08_dr_rashel_sun_cream.png",
  "wrist-blood-pressure-monitor":   "products/13_blood_pressure_monitor.png",
  "sports-knee-support":            "products/15_knee_support.png",
  "resistance-bands-set-11pcs":     "products/16_resistance_bands_set.png",
  "kitchen-knife-set-6pcs":         "products/01_knife_set.png",
  "multifunctional-shower-set":     "products/02_universal_shower.png",
  "solar-led-wall-lamp":            "products/17_solar_wall_lamp.png",
  "vtackup-kitchen-cleaner":        "products/18_kitchen_cleaner_spray.png",
  "mini-travel-iron":               "products/19_mini_ironing_machine.png",
  "usb-electric-lint-remover":      "products/21_lint_remover.png",
  "led-makeup-mirror-bag":          "products/14_led_makeup_mirror_box.png",
  "crab-magnetic-drawing-board":    "products/04_crab_magnetic_sketchpad.png",
  "led-flying-spinner-ball":        "products/20_flying_spinner.png",
  "marble-run-building-blocks":     "products/22_building_blocks_marble_run.png",
  "34-hole-bubble-gun":             "products/23_bubble_gun.png",
}

// ─── Categories ───────────────────────────────────────────────────────────────

const CATEGORIES = [
  { name: "الإلكترونيات الذكية", handle: "smart-electronics" },
  { name: "الصحة والجمال",        handle: "health-beauty" },
  { name: "المنزل والمطبخ",       handle: "home-kitchen" },
  { name: "ألعاب الأطفال",        handle: "kids-toys" },
]

// ─── Products ─────────────────────────────────────────────────────────────────

const PRODUCTS = [
  // ── الإلكترونيات الذكية ────────────────────────────────────────────────────
  {
    title: "كاميرا مراقبة بانورامية واي فاي",
    handle: "wifi-panorama-camera",
    categories: ["smart-electronics"],
    description: `## كاميرا مراقبة بانورامية واي فاي

كاميرا مراقبة ذكية بتصميم مبتكر على شكل لمبة، تُثبّت مباشرة في قاعدة E27. تتميّز بعدسة بانورامية 360 درجة مع رؤية ليلية بالأشعة تحت الحمراء وإضاءة LED مدمجة. اتصال واي فاي مباشر يتيح لك مشاهدة البث المباشر من هاتفك في أي وقت ومن أي مكان.

### المميزات
- **عدسة بانورامية 360 درجة**
- رؤية ليلية بالأشعة تحت الحمراء
- إضاءة LED مدمجة
- اتصال واي فاي مباشر
- مشاهدة البث المباشر من الهاتف
- مثالية لأمان المنزل والمكتب والمحل التجاري`,
    variants: [
      { title: "الافتراضي", sku: "CAM-PAN-360-DEFAULT", price: 79.900, inventory: 20 },
    ],
  },
  {
    title: "كاميرا واي فاي صغيرة 128GB",
    handle: "mini-wifi-camera-128gb",
    categories: ["smart-electronics"],
    description: `## كاميرا واي فاي صغيرة 128GB

كاميرا تجسس صغيرة الحجم بتصميم كروي أنيق وعدسة عالية الدقة. تدعم بطاقة ذاكرة حتى 128 جيجابايت وتتصل بالواي فاي للمراقبة عن بُعد.

### المميزات
- **دعم بطاقة ذاكرة حتى 128GB**
- اتصال واي فاي للمراقبة عن بُعد
- كشف الحركة التلقائي
- رؤية ليلية
- تسجيل مستمر
- مثالية لمراقبة المنزل، المكتب، أو السيارة بسرية تامة`,
    variants: [
      { title: "الافتراضي", sku: "CAM-MINI-WIFI-128G", price: 59.900, inventory: 25 },
    ],
  },
  {
    title: "جهاز ألعاب لاسلكي M15 Plus",
    handle: "wireless-game-console-m15-plus",
    categories: ["smart-electronics"],
    description: `## جهاز ألعاب لاسلكي M15 Plus

استمتع بآلاف الألعاب الكلاسيكية مع جهاز الألعاب اللاسلكي M15 Plus! يدعم أكثر من 10 محاكيات بما فيها أتاري وسيجا ونينتندو.

### المميزات
- **أكثر من 10,000 لعبة كلاسيكية مدمجة**
- يدعم أتاري، سيجا، ونينتندو
- وحدة تحكم لاسلكية 2.4G بتصميم عصري مريح
- مخرج HDMI عالي الدقة
- معالج قوي ونظام مفتوح المصدر
- **يدعم لاعبَين في آن واحد**
- الهدية المثالية لعشّاق الألعاب الكلاسيكية`,
    variants: [
      { title: "الافتراضي", sku: "GAME-M15-PLUS-DEFAULT", price: 119.900, inventory: 15 },
    ],
  },
  {
    title: "سماعة القرآن الكريم الذكية",
    handle: "smart-quran-speaker",
    categories: ["smart-electronics"],
    description: `## سماعة القرآن الكريم الذكية

سماعة القرآن الكريم المحمولة بتصميم أنيق وعملي. تحتوي على القرآن الكريم كاملاً بأصوات أشهر القرّاء، مع أذكار وأدعية يومية.

### المميزات
- **القرآن الكريم كاملاً** بأصوات أشهر القرّاء
- أذكار وأدعية يومية
- سهلة الاستخدام بأزرار تحكم واضحة
- توصيل مباشر بالكهرباء
- **تطبيق ذكي عبر رمز QR** للتحكم الكامل
- هدية رائعة ومباركة لكل بيت مسلم`,
    variants: [
      { title: "الافتراضي", sku: "QURAN-SPEAKER-DEFAULT", price: 69.900, inventory: 20 },
    ],
  },
  {
    title: "جهاز عرض نجوم ليلي",
    handle: "starry-night-projector",
    categories: ["smart-electronics"],
    description: `## جهاز عرض نجوم ليلي

حوّل غرفتك إلى سماء مليئة بالنجوم! جهاز عرض ليلي بتقنية كريستال متقدمة يعكس أنماط نجوم وأضواء ملونة ساحرة على الجدران والسقف.

### المميزات
- **تقنية كريستال متقدمة** لعرض أنماط نجوم حقيقية
- أضواء ملونة ساحرة على الجدران والسقف
- مثالي كإضاءة ليلية مريحة
- يخلق جواً رومانسياً مميزاً
- مناسب للحفلات والمناسبات
- **تصميم أنيق وصغير الحجم** يناسب أي مكان`,
    variants: [
      { title: "الافتراضي", sku: "PROJECTOR-STAR-DEFAULT", price: 39.900, inventory: 30 },
    ],
  },

  // ── الصحة والجمال ──────────────────────────────────────────────────────────
  {
    title: "مسدس التدليك الاحترافي - 4 ألوان",
    handle: "massage-gun-pro-4colors",
    categories: ["health-beauty"],
    description: `## مسدس التدليك الاحترافي

مسدس تدليك كهربائي احترافي بتصميم أنيق مع لمسات ذهبية فاخرة. متوفر بـ 4 ألوان عصرية.

### المميزات
- **تصميم احترافي** مع لمسات ذهبية فاخرة
- رؤوس تدليك قابلة للتبديل لاستهداف مختلف العضلات
- شحن USB سريع
- محرك قوي وهادئ
- **مثالي لتخفيف آلام العضلات** بعد التمارين والعمل المكتبي`,
    variants: [
      { title: "أسود",  sku: "MASSAGE-GUN-PRO-BLK", price: 79.900, inventory: 15 },
      { title: "أحمر",  sku: "MASSAGE-GUN-PRO-RED", price: 79.900, inventory: 12 },
      { title: "فضي",   sku: "MASSAGE-GUN-PRO-SLV", price: 79.900, inventory: 10 },
      { title: "أخضر",  sku: "MASSAGE-GUN-PRO-GRN", price: 79.900, inventory: 8  },
    ],
  },
  {
    title: "مسدس التدليك المحمول - فضي",
    handle: "massage-gun-compact-silver",
    categories: ["health-beauty"],
    description: `## مسدس التدليك المحمول - فضي

مسدس تدليك صغير ومحمول بتصميم فضي أنيق وخفيف الوزن. بطارية طويلة الأمد وتشغيل هادئ بدون إزعاج.

### المميزات
- **تصميم صغير ومحمول** مثالي للسفر
- بطارية طويلة الأمد
- تشغيل هادئ بدون إزعاج
- يساعد على **تخفيف التوتر العضلي** وتحسين الدورة الدموية
- مثالي للمنزل، المكتب، والسفر`,
    variants: [
      { title: "فضي", sku: "MASSAGE-GUN-COMPACT-SLV", price: 59.900, inventory: 20 },
    ],
  },
  {
    title: "جل دهان بلسان العجيب للآلام",
    handle: "dahan-bilsan-pain-gel",
    categories: ["health-beauty"],
    description: `## جل دهان بلسان العجيب للآلام

جل دهان بلسان العجيب الأصلي - تركيبة عشبية طبيعية مع دهان جمال جامد لتخفيف الآلام.

### المميزات
- **فعّال ضد آلام المفاصل** والروماتيزم
- يخفف آلام الظهر والعضلات
- **تركيبة عشبية طبيعية 100%** بمكوّنات مجرّبة
- سريع الامتصاص ولطيف على البشرة
- عبوة 100 غرام`,
    variants: [
      { title: "100 غرام", sku: "BILSAN-GEL-100G", price: 19.900, inventory: 40 },
    ],
  },
  {
    title: "واقي شمس DR.RASHEL بالذهب والكولاجين SPF100",
    handle: "dr-rashel-sunscreen-spf100",
    categories: ["health-beauty"],
    description: `## واقي شمس DR.RASHEL بالذهب والكولاجين SPF100

واقي شمس فاخر من DR.RASHEL بتركيبة الذهب والكولاجين المضادة للتجاعيد.

### المميزات
- **حماية فائقة SPF 100** ضد أشعة UVA وUVB
- تركيبة الذهب والكولاجين المضادة للتجاعيد
- **مقاوم للماء** بشكل استثنائي
- غير دهني، خفيف وناعم الملمس
- شفاف 100% على البشرة
- يحمي ويغذّي بشرتك في آن واحد
- **عبوة 40 غرام** مثالية للحقيبة`,
    variants: [
      { title: "40 غرام", sku: "DRASHEL-SUN-SPF100-40G", price: 24.900, inventory: 35 },
    ],
  },
  {
    title: "جهاز قياس ضغط الدم للمعصم - شاشة LED",
    handle: "wrist-blood-pressure-monitor",
    categories: ["health-beauty"],
    description: `## جهاز قياس ضغط الدم للمعصم CK-W118

جهاز قياس ضغط الدم الرقمي للمعصم CK-W118 بشاشة LED كبيرة وواضحة.

### المميزات
- **شاشة LED كبيرة وواضحة**
- يعرض الضغط الانقباضي والانبساطي ومعدل نبضات القلب
- **نظام قياس ذكي** بدقة عالية
- ذاكرة لتخزين القراءات السابقة
- سوار معصم مريح وقابل للتعديل
- **سهل الاستخدام في المنزل** - مثالي لمتابعة صحتك يومياً`,
    variants: [
      { title: "الافتراضي", sku: "BP-MONITOR-WRIST-LED", price: 59.900, inventory: 20 },
    ],
  },
  {
    title: "دعامة الركبة الرياضية",
    handle: "sports-knee-support",
    categories: ["health-beauty"],
    description: `## دعامة الركبة الرياضية

دعامة ركبة رياضية احترافية بتقنية الحياكة الدائرية ثلاثية الأبعاد.

### المميزات
- **تقنية الحياكة الدائرية ثلاثية الأبعاد**
- قماش مرن وشفاف يوفّر ضغطاً متوازناً
- **دعم ممتاز للركبة** أثناء الرياضة والنشاطات اليومية
- حرية الحركة الكاملة
- حماية 360 درجة مع خياطة مقاومة للتآكل
- مثالية للجري، كرة القدم، ورفع الأثقال`,
    variants: [
      { title: "الافتراضي", sku: "KNEE-SUPPORT-SPORT", price: 24.900, inventory: 30 },
    ],
  },
  {
    title: "مجموعة أحبال المقاومة للتمارين - 11 قطعة",
    handle: "resistance-bands-set-11pcs",
    categories: ["health-beauty"],
    description: `## مجموعة أحبال المقاومة للتمارين - 11 قطعة

مجموعة تمارين متكاملة من 11 قطعة لجميع مستويات اللياقة.

### المحتويات
- **5 أحبال مقاومة** بألوان مختلفة (مستويات مقاومة متدرّجة)
- مقبضان مبطّنان
- حزامان للكاحل
- مرساة باب
- **حقيبة حمل**

### المميزات
- لاتكس طبيعي عالي الجودة مع خطافات معدنية متينة
- مثالية لتمارين القوة واللياقة في المنزل أو الجيم`,
    variants: [
      { title: "مجموعة 11 قطعة", sku: "RESISTANCE-BANDS-11PCS", price: 39.900, inventory: 25 },
    ],
  },

  // ── المنزل والمطبخ ─────────────────────────────────────────────────────────
  {
    title: "طقم سكاكين مطبخ احترافي - 6 قطع",
    handle: "kitchen-knife-set-6pcs",
    categories: ["home-kitchen"],
    description: `## طقم سكاكين مطبخ احترافي - 6 قطع

طقم سكاكين مطبخ احترافي من 6 قطع بطبقة غير لاصقة سوداء أنيقة.

### المحتويات
- مقص مطبخ
- مقشّرة سيراميك
- سكين تقشير 3.5 بوصة
- ساطور صغير 8 بوصة
- سكين نحت 8 بوصة
- **سكين شيف 8 بوصة**

### المميزات
- شفرات حادة من **الستانلس ستيل**
- مقابض مريحة مانعة للانزلاق
- طبقة غير لاصقة سوداء أنيقة
- الأداة المثالية لكل مطبخ`,
    variants: [
      { title: "طقم كامل 6 قطع", sku: "KNIFE-SET-6PCS", price: 59.900, inventory: 20 },
    ],
  },
  {
    title: "دش استحمام متعدد الوظائف",
    handle: "multifunctional-shower-set",
    categories: ["home-kitchen"],
    description: `## دش استحمام متعدد الوظائف

نظام دش استحمام عصري متعدد الوظائف بتصميم أسود أنيق.

### المحتويات
- رأس دش مطري مربع كبير
- **رأس دش يدوي متحرك** مع خرطوم مرن

### المميزات
- تدفّق مياه قوي ومتساوي
- تركيب سهل وعملي
- **يحوّل حمّامك إلى تجربة فاخرة**
- مناسب لجميع أنواع التوصيلات`,
    variants: [
      { title: "الافتراضي", sku: "SHOWER-MULTI-DEFAULT", price: 79.900, inventory: 15 },
    ],
  },
  {
    title: "مصباح حائط شمسي LED بمستشعر حركة",
    handle: "solar-led-wall-lamp",
    categories: ["home-kitchen"],
    description: `## مصباح حائط شمسي LED بمستشعر حركة

مصباح حائط خارجي يعمل بالطاقة الشمسية مع مصابيح COB LED فائقة السطوع.

### المميزات
- **يعمل بالطاقة الشمسية** - توفير 100% في فاتورة الكهرباء
- مستشعر حركة ذكي للإضاءة التلقائية
- لوحة شمسية مدمجة
- **ريموت تحكم عن بُعد**
- مقاوم للماء والطقس القاسي
- تركيب سهل بدون أسلاك
- مثالي للحدائق، الممرات، المداخل، والأسوار`,
    variants: [
      { title: "الافتراضي", sku: "SOLAR-LED-WALL-DEFAULT", price: 34.900, inventory: 25 },
    ],
  },
  {
    title: "بخاخ تنظيف المطبخ VTACKUP",
    handle: "vtackup-kitchen-cleaner",
    categories: ["home-kitchen"],
    description: `## بخاخ تنظيف المطبخ VTACKUP

بخاخ تنظيف المطبخ القوي من VTACKUP - مزيل شحوم فعّال وسريع المفعول.

### المميزات
- **مزيل شحوم فعّال** للأفران، المواقد، الشفاطات
- تنظيف جميع أسطح المطبخ
- تركيبة قوية **تذيب الدهون المتراكمة** بسهولة
- لا يتلف الأسطح
- **عبوة 500 مل**
- نظافة لامعة بدون مجهود`,
    variants: [
      { title: "أزرق",    sku: "VTACKUP-CLEANER-BLU", price: 14.900, inventory: 40 },
      { title: "برتقالي", sku: "VTACKUP-CLEANER-ORG", price: 14.900, inventory: 40 },
    ],
  },
  {
    title: "مكواة صغيرة محمولة للسفر",
    handle: "mini-travel-iron",
    categories: ["home-kitchen"],
    description: `## مكواة صغيرة محمولة للسفر

مكواة كهربائية صغيرة ومحمولة بتصميم أنيق وقابل للطي.

### المميزات
- **قاعدة كي من الستانلس ستيل**
- تسخين سريع (30 واط)
- **خفيفة الوزن** وسهلة التخزين
- مثالية للسفر والاستخدام اليومي السريع
- تزيل التجاعيد من الملابس بسرعة وكفاءة
- **فولتية 220 فولت**`,
    variants: [
      { title: "أخضر", sku: "IRON-MINI-TRAVEL-GRN", price: 24.900, inventory: 20 },
    ],
  },
  {
    title: "مزيل الوبر الكهربائي - شحن USB",
    handle: "usb-electric-lint-remover",
    categories: ["home-kitchen"],
    description: `## مزيل الوبر الكهربائي - شحن USB

مزيل وبر كهربائي احترافي بتصميم أنيق باللون الأخضر الداكن.

### المميزات
- **شبكة ستانلس ستيل** عالية الجودة
- يزيل الوبر وكرات القماش بلطف دون إتلاف الملابس
- **شحن USB مريح** وبطارية طويلة الأمد
- مثالي للملابس الصوفية، المعاطف، الأرائك، والمفروشات
- أعد لملابسك **مظهرها الجديد**`,
    variants: [
      { title: "أخضر داكن", sku: "LINT-REMOVER-USB-GRN", price: 19.900, inventory: 30 },
    ],
  },
  {
    title: "حقيبة مكياج مع مرآة LED",
    handle: "led-makeup-mirror-bag",
    categories: ["home-kitchen"],
    description: `## حقيبة مكياج مع مرآة LED

حقيبة مكياج فاخرة من الجلد الوردي مع مرآة LED مدمجة قابلة للدوران 360 درجة.

### المميزات
- **مرآة LED مدمجة** قابلة للدوران 360 درجة
- إضاءة LED قابلة للتعديل بـ 3 درجات حرارة لونية
- تقسيمات داخلية متعددة لتنظيم المكياج بالكامل
- **حامل فُرَش منفصل**
- تصميم عملي وأنيق من الجلد الوردي
- **هدية مثالية** مثالية للسفر والاستخدام اليومي`,
    variants: [
      { title: "وردي", sku: "MAKEUP-BAG-LED-PINK", price: 49.900, inventory: 15 },
    ],
  },

  // ── ألعاب الأطفال ──────────────────────────────────────────────────────────
  {
    title: "لوح رسم مغناطيسي - شكل سلطعون",
    handle: "crab-magnetic-drawing-board",
    categories: ["kids-toys"],
    description: `## لوح رسم مغناطيسي - شكل سلطعون

لوح رسم مغناطيسي تعليمي بتصميم سلطعون لطيف يجذب الأطفال!

### المحتويات
- **50 كرة ملوّنة مغناطيسية** (أحمر، أزرق، أصفر، أخضر، أسود)
- قلم مغناطيسي
- **20 بطاقة أنماط مرجعية**

### المميزات
- ينمّي مهارات الرسم والتركيز
- يعزز التفكير المنطقي وتعلّم الألوان
- **آمن وممتع** للأطفال
- مناسب للأطفال **من عمر 3 سنوات** فما فوق`,
    variants: [
      { title: "الافتراضي", sku: "CRAB-MAGNET-DRAW-DEFAULT", price: 29.900, inventory: 25 },
    ],
  },
  {
    title: "كرة طائرة دوّارة مضيئة LED",
    handle: "led-flying-spinner-ball",
    categories: ["kids-toys"],
    description: `## كرة طائرة دوّارة مضيئة LED

لعبة الكرة الطائرة الدوّارة المضيئة - المرح الذي لا ينتهي!

### المميزات
- **تصميم كروي مفتوح** مع إضاءة LED ساحرة بألوان متعددة
- ارمها في الهواء وشاهدها **تعود إليك كالبوميرانغ**
- تعمل بالشحن
- مصنوعة من مواد آمنة ومتينة
- **للأطفال من 6 سنوات** فما فوق
- هدية مبهرة!`,
    variants: [
      { title: "وردي", sku: "SPINNER-LED-PINK", price: 19.900, inventory: 30 },
      { title: "أزرق",  sku: "SPINNER-LED-BLU",  price: 19.900, inventory: 30 },
    ],
  },
  {
    title: "مكعبات بناء مسار الكرات - 48 قطعة",
    handle: "marble-run-building-blocks",
    categories: ["kids-toys"],
    description: `## مكعبات بناء مسار الكرات التعليمية - 48 قطعة

مجموعة بناء مسار الكرات التعليمية - 48 قطعة من المكعبات الملوّنة القابلة للتركيب!

### المحتويات
- **48 قطعة** تشمل: أنابيب، منحنيات، قمع، وكرات ملوّنة

### المميزات
- بناء مسارات متنوّعة ومبتكرة
- **تنمّي الخيال والإبداع** والتفكير الهندسي
- ألوان زاهية ومواد بلاستيكية آمنة عالية الجودة
- **ساعات من المتعة والتعلّم**`,
    variants: [
      { title: "مجموعة 48 قطعة", sku: "MARBLE-RUN-48PCS", price: 39.900, inventory: 20 },
    ],
  },
  {
    title: "مسدس فقاعات 34 فتحة",
    handle: "34-hole-bubble-gun",
    categories: ["kids-toys"],
    description: `## مسدس فقاعات عملاق - 34 فتحة

مسدس فقاعات عملاق بـ 34 فتحة يصنع مئات الفقاعات في ثوانٍ!

### المميزات
- **34 فتحة** تصنع مئات الفقاعات في ثوانٍ
- تصميم صاروخي رائع باللون التركواز
- محرك كهربائي قوي
- **سهل الاستخدام** بضغطة زر واحدة
- مثالي للحفلات، أعياد الميلاد، واللعب في الحدائق
- **للأطفال من 3 سنوات** فما فوق`,
    variants: [
      { title: "الافتراضي", sku: "BUBBLE-GUN-34HOLE", price: 19.900, inventory: 35 },
    ],
  },
]

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Starting seed...\n")

  // ── Validate Cloudinary config ──────────────────────────────────────────────
  _cloudOk =
    !!(process.env.CLOUDINARY_CLOUD_NAME?.trim() &&
    process.env.CLOUDINARY_API_KEY?.trim() &&
    process.env.CLOUDINARY_API_SECRET?.trim())
  if (!_cloudOk) {
    console.warn("⚠  Cloudinary env vars missing — images will be skipped")
  }

  // ── Admin user ──────────────────────────────────────────────────────────────
  const password = await bcrypt.hash("admin123", 10)
  await prisma.user.upsert({
    where: { email: "admin@localhost" },
    update: { role: "admin", password },
    create: {
      email: "admin@localhost",
      password,
      firstName: "Admin",
      lastName: "User",
      role: "admin",
    },
  })
  console.log("✓ Admin user: admin@localhost / admin123")

  // ── Clean old demo data (full reset) ────────────────────────────────────────
  // Delete in FK-safe order (children before parents)
  await prisma.orderItem.deleteMany({})
  await prisma.order.deleteMany({})
  await prisma.cartItem.deleteMany({})
  await prisma.cart.deleteMany({})
  await prisma.promotion.deleteMany({})
  await prisma.productImage.deleteMany({})
  await prisma.option.deleteMany({})
  await prisma.variant.deleteMany({})
  await prisma.product.deleteMany({})
  await prisma.category.deleteMany({})
  console.log("✓ All demo data cleared (full reset)")

  // ── Categories ──────────────────────────────────────────────────────────────
  const catMap = {}
  for (const cat of CATEGORIES) {
    let imageUrl = null
    if (_cloudOk && CATEGORY_IMAGE_MAP[cat.handle]) {
      process.stdout.write(`  ↑ Uploading category image: ${cat.handle}... `)
      imageUrl = await uploadImage(
        CATEGORY_IMAGE_MAP[cat.handle],
        `taktak/categories/${cat.handle}`,
      )
      console.log(imageUrl ? "✓" : "✗")
    }

    const record = await prisma.category.upsert({
      where: { handle: cat.handle },
      update: { name: cat.name, ...(imageUrl ? { image: imageUrl } : {}) },
      create: { name: cat.name, handle: cat.handle, image: imageUrl },
    })
    catMap[cat.handle] = record
    console.log(`  + Category: ${cat.name}`)
  }
  console.log(`✓ ${CATEGORIES.length} categories seeded`)

  // ── Products ────────────────────────────────────────────────────────────────
  let productCount = 0
  for (const p of PRODUCTS) {
    // Always recreate since we deleted all above
    const product = await prisma.product.create({
      data: {
        title: p.title,
        handle: p.handle,
        description: p.description,
        status: "published",
        categories: {
          connect: p.categories.map((h) => ({ id: catMap[h].id })),
        },
        variants: {
          create: p.variants.map((v) => ({
            title: v.title,
            sku: v.sku,
            price: v.price,
            inventory: v.inventory,
          })),
        },
      },
    })

    // Upload product image
    if (_cloudOk && PRODUCT_IMAGE_MAP[p.handle]) {
      process.stdout.write(`  ↑ Uploading product image: ${p.handle}... `)
      const imageUrl = await uploadImage(
        PRODUCT_IMAGE_MAP[p.handle],
        `taktak/products/${p.handle}`,
      )
      console.log(imageUrl ? "✓" : "✗")

      if (imageUrl) {
        await prisma.productImage.create({
          data: {
            productId: product.id,
            url: imageUrl,
            alt: p.title,
            sortOrder: 0,
          },
        })
      }
    }

    productCount++
    console.log(`  + ${p.title} (${p.variants.length} متغير)`)
  }

  console.log(`\n✓ ${productCount} products seeded`)

  // ── Promotions ──────────────────────────────────────────────────────────────
  const PROMOTIONS = [
    { code: "WELCOME10", value: 10, type: "percentage", isActive: true, maxUses: null, minOrderAmount: null, startDate: null, endDate: null },
    { code: "SUMMER20", value: 20, type: "percentage", isActive: true, maxUses: 100, minOrderAmount: 50, startDate: null, endDate: null },
    { code: "FLAT5", value: 5, type: "fixed", isActive: true, maxUses: null, minOrderAmount: null, startDate: null, endDate: null },
  ]
  for (const promo of PROMOTIONS) {
    await prisma.promotion.upsert({
      where: { code: promo.code },
      update: { value: promo.value, type: promo.type, isActive: promo.isActive, maxUses: promo.maxUses, minOrderAmount: promo.minOrderAmount },
      create: promo,
    })
    console.log(`  + Promotion: ${promo.code}`)
  }
  console.log(`✓ ${PROMOTIONS.length} promotions seeded`)
  console.log("\n✅ Seed complete!")
  if (!_cloudOk) {
    console.log("\nℹ  Cloudinary not configured — using local image paths as fallback.")
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
