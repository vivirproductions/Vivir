import type { Metadata } from "next";
import { VariantDocument } from "@/components/variant-document";
import { variantBySlug } from "@/variants/registry";

const variant = variantBySlug["v4-blue"];

export const metadata: Metadata = {
  title: variant.title,
  description: variant.description,
};

export default function V4BluePage() {
  return <VariantDocument slug="v4-blue" />;
}
