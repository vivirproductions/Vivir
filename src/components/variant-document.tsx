"use client";

import { useEffect } from "react";
import { ReviewSwitcher } from "@/components/review-switcher";
import type { VariantPage, VariantSlug } from "@/variants/registry";
import { variantDocuments } from "@/variants/generated/documents";

type VariantDocumentProps = {
  slug: VariantSlug;
  page: VariantPage;
};

export function VariantDocument({ slug, page }: VariantDocumentProps) {
  const source = variantDocuments[slug];

  useEffect(() => {
    try {
      const execute = new Function(source.script);
      execute();
    } catch (err) {
      console.error("Variant script failed to run:", err);
    }
  }, [page, source.script]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: source.css }} />
      <ReviewSwitcher current={slug} />
      <div dangerouslySetInnerHTML={{ __html: source.bodyByPage[page] }} />
    </>
  );
}
