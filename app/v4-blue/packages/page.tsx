import type { Metadata } from "next";
import { VariantDocument } from "@/components/variant-document";
import { variantBySlug } from "@/variants/registry";

const variant = variantBySlug["v4-blue"];

export const metadata: Metadata = {
  title: "Vivír · Packages",
  description: `Vivír ${variant.name} wedding and debut packages.`,
};

export default function V4BluePackagesPage() {
  return <VariantDocument slug="v4-blue" page="packages" />;
}
