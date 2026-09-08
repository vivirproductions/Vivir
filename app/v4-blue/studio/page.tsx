import type { Metadata } from "next";
import { VariantDocument } from "@/components/variant-document";
import { variantBySlug } from "@/variants/registry";

const variant = variantBySlug["v4-blue"];

export const metadata: Metadata = {
  title: `${variant.name} Studio`,
  description: `Vivír ${variant.name} studio page.`,
};

export default function V4BlueStudioPage() {
  return <VariantDocument slug="v4-blue" page="studio" />;
}
