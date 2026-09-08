import type { Metadata } from "next";
import { VariantDocument } from "@/components/variant-document";
import { variantBySlug } from "@/variants/registry";

const variant = variantBySlug["v2-sanctuary"];

export const metadata: Metadata = {
  title: "Vivír · Our Testimony",
  description: `Vivír ${variant.name} about page.`,
};

export default function V2SanctuaryStudioPage() {
  return <VariantDocument slug="v2-sanctuary" page="studio" />;
}
