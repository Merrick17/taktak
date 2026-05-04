import { createHash } from "crypto"
import { Resend } from "resend"
import { formatPrice } from "@/lib/types"

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  return new Resend(key)
}

const FROM_EMAIL_RAW = process.env.RESEND_FROM_EMAIL ?? "noreply@taktakstore.com"
const STORE_NAME = process.env.NEXT_PUBLIC_STORE_NAME ?? "TakTak"

/** Resend `from` supports `Name <email@domain.com>`; use friendly name when value is a bare address. */
function fromHeader(): string {
  const raw = FROM_EMAIL_RAW.trim()
  if (raw.includes("<") && raw.includes(">")) return raw
  return `${STORE_NAME} <${raw}>`
}

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100
}

export async function sendOrderConfirmation(
  order: {
    id: string
    displayId: string
    total: number
    currencyCode: string
    subtotal?: number
    discountAmount?: number
    shippingFee?: number
    shippingAddress:
      | {
          firstName?: string
          lastName?: string
          address?: string
          city?: string
        }
      | null
    items: { title: string; quantity: number; unitPrice: number }[]
  },
  userEmail: string
): Promise<boolean> {
  const resend = getResend()
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping order confirmation email")
    return false
  }

  const itemRows = order.items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px 0;border-bottom:1px solid #eee">${item.title}</td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right">${formatPrice(item.unitPrice * item.quantity, order.currencyCode)}</td>
        </tr>`
    )
    .join("")

  const addr = order.shippingAddress
  const addrLine = addr
    ? `${addr.firstName ?? ""} ${addr.lastName ?? ""}, ${addr.address ?? ""}, ${addr.city ?? ""}`
    : ""

  const lineSubtotal =
    order.subtotal ??
    roundMoney(order.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0))
  const discount = roundMoney(Math.max(0, order.discountAmount ?? 0))
  const shipping =
    order.shippingFee !== undefined
      ? roundMoney(Math.max(0, order.shippingFee))
      : roundMoney(Math.max(0, order.total - (lineSubtotal - discount)))

  const summaryRows = `
    <tr><td style="padding:6px 0;color:#555">المجموع الفرعي</td><td style="padding:6px 0;text-align:left;font-weight:600">${formatPrice(lineSubtotal, order.currencyCode)}</td></tr>
    ${
      discount > 0
        ? `<tr><td style="padding:6px 0;color:#555">الخصم</td><td style="padding:6px 0;text-align:left;font-weight:600">−${formatPrice(discount, order.currencyCode)}</td></tr>`
        : ""
    }
    <tr><td style="padding:6px 0;color:#555">الشحن والتوصيل</td><td style="padding:6px 0;text-align:left;font-weight:600">${shipping > 0 ? formatPrice(shipping, order.currencyCode) : "مجاني"}</td></tr>
  `

  const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:Arial,sans-serif;background:#f9f9f9;margin:0;padding:24px">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #eee">
    <div style="background:#111;padding:24px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:22px">${STORE_NAME}</h1>
    </div>
    <div style="padding:32px">
      <h2 style="margin-top:0">شكراً لطلبك!</h2>
      <p style="color:#555">تم استلام طلبك رقم <strong>#${order.displayId}</strong> بنجاح. سيتم التواصل معك قريباً لتأكيد التوصيل.</p>
      <table style="width:100%;border-collapse:collapse;margin:24px 0">
        <thead>
          <tr style="border-bottom:2px solid #111">
            <th style="text-align:right;padding:8px 0">المنتج</th>
            <th style="text-align:center;padding:8px 0">الكمية</th>
            <th style="text-align:right;padding:8px 0">السعر</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>
      <table style="width:100%;border-collapse:collapse;margin:0 0 16px 0;font-size:14px">
        <tbody>${summaryRows}</tbody>
      </table>
      <div style="text-align:left;font-size:18px;font-weight:bold;border-top:2px solid #111;padding-top:12px">
        الإجمالي: ${formatPrice(order.total, order.currencyCode)}
      </div>
      ${addrLine ? `<p style="color:#555;margin-top:24px">📍 عنوان التوصيل: ${addrLine}</p>` : ""}
      <p style="color:#555">طريقة الدفع: الدفع عند الاستلام</p>
    </div>
    <div style="background:#f5f5f5;padding:16px;text-align:center;color:#888;font-size:12px">
      &copy; ${new Date().getFullYear()} ${STORE_NAME}. جميع الحقوق محفوظة.
    </div>
  </div>
</body>
</html>`

  const idempotencyKey = `order-confirmation/${order.id}`.slice(0, 256)

  const { data, error } = await resend.emails.send(
    {
      from: fromHeader(),
      to: userEmail,
      subject: `تأكيد طلبك #${order.displayId} — ${STORE_NAME}`,
      html,
      tags: [
        { name: "category", value: "order_confirmation" },
        { name: "order_id", value: order.id },
      ],
    },
    { idempotencyKey }
  )

  if (error) {
    console.error("Failed to send order confirmation email:", error)
    return false
  }

  if (data?.id) {
    console.info("Order confirmation email sent:", data.id)
  }
  return true
}

export async function sendPasswordReset(toEmail: string, resetUrl: string): Promise<boolean> {
  const resend = getResend()
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping password reset email")
    return false
  }

  const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;background:#f9f9f9;margin:0;padding:24px">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #eee">
    <div style="background:#111;padding:24px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:22px">${STORE_NAME}</h1>
    </div>
    <div style="padding:32px">
      <h2 style="margin-top:0">إعادة تعيين كلمة المرور</h2>
      <p style="color:#555">تلقينا طلباً لإعادة تعيين كلمة المرور لحسابك. اضغط على الزر أدناه خلال ساعة.</p>
      <div style="text-align:center;margin:32px 0">
        <a href="${resetUrl}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:bold">
          إعادة تعيين كلمة المرور
        </a>
      </div>
      <p style="color:#999;font-size:12px">إذا لم تطلب ذلك، تجاهل هذه الرسالة. لن يتغير شيء.</p>
    </div>
    <div style="background:#f5f5f5;padding:16px;text-align:center;color:#888;font-size:12px">
      &copy; ${new Date().getFullYear()} ${STORE_NAME}.
    </div>
  </div>
</body>
</html>`

  const idempotencyKey = `password-reset/${createHash("sha256").update(resetUrl).digest("hex")}`.slice(0, 256)

  const { data, error } = await resend.emails.send(
    {
      from: fromHeader(),
      to: toEmail,
      subject: `إعادة تعيين كلمة المرور — ${STORE_NAME}`,
      html,
      tags: [{ name: "category", value: "password_reset" }],
    },
    { idempotencyKey }
  )

  if (error) {
    console.error("Failed to send password reset email:", error)
    return false
  }

  if (data?.id) {
    console.info("Password reset email sent:", data.id)
  }
  return true
}
