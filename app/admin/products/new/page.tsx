"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ProductForm } from "../_components/product-form";
import type { ProductFormData } from "../_components/product-form";

const INITIAL: ProductFormData = {
  title: "",
  description: "",
  handle: "",
  status: "published",
  adsBoosted: false,
  categoryIds: [],
  images: [],
  variants: [{ sku: "", price: 0, inventory: 0, title: "", options: [] }],
};

function NewProductContent() {
  const searchParams = useSearchParams();
  const duplicate = searchParams.get("duplicate");

  let initial: ProductFormData = INITIAL;

  if (duplicate) {
    try {
      const parsed = JSON.parse(decodeURIComponent(duplicate));
      initial = {
        title: parsed.title ?? "",
        description: parsed.description ?? "",
        handle: parsed.handle ?? "",
        status: parsed.status ?? "draft",
        adsBoosted: parsed.adsBoosted ?? false,
        categoryIds: parsed.categoryIds ?? [],
        images: parsed.images ?? [],
        variants: parsed.variants ?? [
          { sku: "", price: 0, inventory: 0, title: "", options: [] },
        ],
      };
    } catch {
      // If parsing fails, fall back to defaults
    }
  }

  return <ProductForm initial={initial} />;
}

export default function NewProductPage() {
  return (
    <Suspense>
      <NewProductContent />
    </Suspense>
  );
}
