import type { Metadata } from "next";
import { VariantDocument } from "@/components/variant-document";
import { variantBySlug } from "@/variants/registry";

const variant = variantBySlug["v1-ochre"];

export const metadata: Metadata = {
  title: `${variant.name} Film archive`,
  description: `Vivír ${variant.name} film archive.`,
};

export default function V1OchreFilmsPage() {
  return <VariantDocument slug="v1-ochre" page="films" />;
}
