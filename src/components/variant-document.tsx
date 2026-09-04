"use client";

import { useEffect, useId } from "react";
import { ReviewSwitcher } from "@/components/review-switcher";
import type { VariantSlug } from "@/variants/registry";
import { variantDocuments } from "@/variants/generated/documents";

type VariantDocumentProps = {
  slug: VariantSlug;
};

export function VariantDocument({ slug }: VariantDocumentProps) {
  const documentId = useId();
  const source = variantDocuments[slug];

  useEffect(() => {
    const execute = new Function(source.script);
    execute();
  }, [source.script, documentId]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: source.css }} />
      <ReviewSwitcher current={slug} />
      <div dangerouslySetInnerHTML={{ __html: source.body }} />
    </>
  );
}
