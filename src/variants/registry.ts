export type VariantSlug = "v1-ochre" | "v2-sanctuary" | "v4-blue";

export type Variant = {
  slug: VariantSlug;
  version: "V1" | "V2" | "V4";
  name: string;
  title: string;
  description: string;
  accent: string;
  palette: readonly string[];
};

export const variants = [
  {
    slug: "v1-ochre",
    version: "V1",
    name: "Ochre",
    title: "Vivir - Ink & Ochre",
    description: "Vivir V1 Ochre - film index landing page.",
    accent: "#C8802A",
    palette: ["#0B0B0C", "#F4F1EA", "#C8802A", "#8A857C", "#1C1B19"],
  },
  {
    slug: "v2-sanctuary",
    version: "V2",
    name: "Sanctuary",
    title: "Vivir - Ink & Sanctuary",
    description: "Vivir V2 Sanctuary - film index landing page.",
    accent: "#A8894F",
    palette: ["#0B0B0C", "#F4F1EA", "#A8894F", "#8A857C", "#0C1F17"],
  },
  {
    slug: "v4-blue",
    version: "V4",
    name: "Blue",
    title: "Vivir - Ink & Blue",
    description: "Vivir V4 Blue - film index landing page.",
    accent: "#0096C7",
    palette: ["#0B0B0C", "#F4F1EA", "#0096C7", "#8A857C", "#0E1D23"],
  },
] as const satisfies readonly Variant[];

export const variantBySlug = {
  "v1-ochre": variants[0],
  "v2-sanctuary": variants[1],
  "v4-blue": variants[2],
} satisfies Record<VariantSlug, Variant>;

export function isVariantSlug(value: string): value is VariantSlug {
  return value in variantBySlug;
}
