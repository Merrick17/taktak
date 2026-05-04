import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Legacy shadcn preview components (missing deps, not part of the app)
    "components/cart-*.tsx",
    "components/category-*.tsx",
    "components/checkout-*.tsx",
    "components/order-*.tsx",
    "components/product-card-*.tsx",
    "components/product-detail-*.tsx",
    "components/promo-banner-*.tsx",
    "components/review-*.tsx",
  ]),
]);

export default eslintConfig;
