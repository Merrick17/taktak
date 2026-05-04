import type { AppRegion } from "@/lib/types"

const DEFAULT_REGION: AppRegion = {
  id: "default",
  name: "تونس",
  currency_code: "tnd",
}

export async function getDefaultRegion(): Promise<AppRegion | null> {
  return DEFAULT_REGION
}
