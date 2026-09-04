import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { variants } from "@/variants/registry";

export default function Home() {
  return (
    <main className="review-home">
      <div className="review-home__inner">
        <Image
          className="review-home__brand"
          src="/brand/wordmark-white.png"
          alt="Vivir"
          width={1400}
          height={445}
          priority
        />
        <p className="review-home__kicker">Color direction review</p>
        <h1>Three approved Vivir directions</h1>
        <div className="review-home__grid" aria-label="Approved color versions">
          {variants.map((variant) => (
            <Link
              className="review-card"
              href={`/${variant.slug}`}
              key={variant.slug}
              style={{ "--accent": variant.accent } as CSSProperties}
            >
              <span className="review-card__top">
                <span className="review-card__version">{variant.version}</span>
                <span className="review-card__name">{variant.name}</span>
              </span>
              <span className="review-card__palette" aria-label={`${variant.name} palette`}>
                {variant.palette.map((color) => (
                  <span
                    className="review-card__swatch"
                    key={color}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </span>
              <span className="review-card__open">Open direction</span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
