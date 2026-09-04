import type { Metadata } from "next";
import { VariantDocument } from "@/components/variant-document";
import { variantBySlug } from "@/variants/registry";

const variant = variantBySlug["v2-sanctuary"];

export const metadata: Metadata = {
  title: variant.title,
  description: variant.description,
};

export default function V2SanctuaryPage() {
  return <VariantDocument slug="v2-sanctuary" />;
}
