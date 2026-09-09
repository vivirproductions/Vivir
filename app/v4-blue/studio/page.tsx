import type { Metadata } from "next";
import { VariantDocument } from "@/components/variant-document";
import { variantBySlug } from "@/variants/registry";

const variant = variantBySlug["v4-blue"];

export const metadata: Metadata = {
  title: "Vivír · Our Testimony",
  description: `Vivír ${variant.name} studio testimony.`,
};

export default function V4BlueStudioPage() {
  return <VariantDocument slug="v4-blue" page="studio" />;
}
