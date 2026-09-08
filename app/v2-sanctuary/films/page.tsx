import type { Metadata } from "next";
import { VariantDocument } from "@/components/variant-document";
import { variantBySlug } from "@/variants/registry";

const variant = variantBySlug["v2-sanctuary"];

export const metadata: Metadata = {
  title: `${variant.name} Film archive`,
  description: `Vivír ${variant.name} film archive.`,
};

export default function V2SanctuaryFilmsPage() {
  return <VariantDocument slug="v2-sanctuary" page="films" />;
}
