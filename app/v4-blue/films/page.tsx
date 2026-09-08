import type { Metadata } from "next";
import { VariantDocument } from "@/components/variant-document";
import { variantBySlug } from "@/variants/registry";

const variant = variantBySlug["v4-blue"];

export const metadata: Metadata = {
  title: "Vivír · Films",
  description: `Vivír ${variant.name} film archive.`,
};

export default function V4BlueFilmsPage() {
  return <VariantDocument slug="v4-blue" page="films" />;
}
