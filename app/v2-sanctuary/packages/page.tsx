import type { Metadata } from "next";
import { VariantDocument } from "@/components/variant-document";
import { variantBySlug } from "@/variants/registry";

const variant = variantBySlug["v2-sanctuary"];

export const metadata: Metadata = {
  title: "Vivír · Packages",
  description: `Vivír ${variant.name} wedding and debut packages.`,
};

export default function V2SanctuaryPackagesPage() {
  return <VariantDocument slug="v2-sanctuary" page="packages" />;
}
