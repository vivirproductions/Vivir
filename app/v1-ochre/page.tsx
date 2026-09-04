import type { Metadata } from "next";
import { VariantDocument } from "@/components/variant-document";
import { variantBySlug } from "@/variants/registry";

const variant = variantBySlug["v1-ochre"];

export const metadata: Metadata = {
  title: variant.title,
  description: variant.description,
};

export default function V1OchrePage() {
  return <VariantDocument slug="v1-ochre" />;
}
