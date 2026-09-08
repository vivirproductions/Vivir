import type { Metadata } from "next";
import { VariantDocument } from "@/components/variant-document";
import { variantBySlug } from "@/variants/registry";

const variant = variantBySlug["v1-ochre"];

export const metadata: Metadata = {
  title: "Vivír · Our Testimony",
  description: `Vivír ${variant.name} about page.`,
};

export default function V1OchreStudioPage() {
  return <VariantDocument slug="v1-ochre" page="studio" />;
}
