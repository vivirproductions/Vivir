import Link from "next/link";
import type { CSSProperties } from "react";
import { variants, type VariantSlug } from "@/variants/registry";

type ReviewSwitcherProps = {
  current: VariantSlug;
};

export function ReviewSwitcher({ current }: ReviewSwitcherProps) {
  return (
    <aside
      className="vivir-review-switcher"
      aria-label="Vivír color palettes"
      style={
        {
          "--variant-accent": variants.find((variant) => variant.slug === current)?.accent,
        } as CSSProperties
      }
    >
      <Link href="/">All</Link>
      {variants.map((variant) => (
        <Link
          key={variant.slug}
          href={`/${variant.slug}`}
          aria-current={variant.slug === current ? "page" : undefined}
        >
          {variant.name}
        </Link>
      ))}
    </aside>
  );
}
