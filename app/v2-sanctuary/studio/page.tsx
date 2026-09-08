import type { Metadata } from "next";
import { VariantDocument } from "@/components/variant-document";
import { variantBySlug } from "@/variants/registry";

const variant = variantBySlug["v2-sanctuary"];

export const metadata: Metadata = {
  title: `${variant.name} Studio`,
  description: `Vivír ${variant.name} studio page.`,
};

export default function V2SanctuaryStudioPage() {
  return <VariantDocument slug="v2-sanctuary" page="studio" />;
}
