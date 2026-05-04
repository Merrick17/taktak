/** Shape stored in Order.shippingAddress (JSON). */
export type ShippingAddressJson = {
  firstName?: string
  lastName?: string
  phone?: string
  address?: string
  city?: string
  countryCode?: string
}

export function parseShippingAddress(raw: unknown): ShippingAddressJson | null {
  if (raw == null || typeof raw !== "object") return null
  const o = raw as Record<string, unknown>
  const str = (v: unknown) => (typeof v === "string" ? v : undefined)
  return {
    firstName: str(o.firstName),
    lastName: str(o.lastName),
    phone: str(o.phone),
    address: str(o.address),
    city: str(o.city),
    countryCode: str(o.countryCode),
  }
}
