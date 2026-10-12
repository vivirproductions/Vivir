import type { Metadata } from "next";
import { VariantDocument } from "@/components/variant-document";
import { variantBySlug } from "@/variants/registry";

const variant = variantBySlug["v1-ochre"];

export const metadata: Metadata = {
  title: "Vivír · Packages",
  description: `Vivír ${variant.name} wedding and debut packages.`,
};

export default function V1OchrePackagesPage() {
  return <VariantDocument slug="v1-ochre" page="packages" />;
}
