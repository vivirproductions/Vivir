import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const assets = {
  brown_sugar: "/brand/brown-sugar.woff2",
  mark_white: "/brand/mark-white.png",
  wordmark_white: "/brand/wordmark-white.png",
  aperture_white: "/brand/aperture-white.png",
};

const sources = [
  ["v1-ochre", "prototypes/film-v1-ochre/index.src.html"],
  ["v2-sanctuary", "prototypes/film-v2-sanctuary/index.src.html"],
  ["v4-blue", "prototypes/film-v4-blue/index.src.html"],
];

function requiredMatch(text, pattern, label, sourcePath) {
  const match = text.match(pattern);
  if (!match) {
    throw new Error(`Could not find ${label} in ${sourcePath}`);
  }
  return match[1];
}

function stripHtmlComments(text) {
  return text.replace(/<!--[\s\S]*?-->/g, "");
}

function stripCssComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, "");
}

function stripJsComments(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

function replaceAssets(text) {
  return text.replace(/\{\{([a-z_]+)\}\}/g, (_match, key) => {
    const value = assets[key];
    if (!value) {
      throw new Error(`Unknown asset placeholder: ${key}`);
    }
    return value;
  });
}

const documents = Object.fromEntries(
  sources.map(([slug, relativePath]) => {
    const sourcePath = path.join(root, relativePath);
    const html = fs.readFileSync(sourcePath, "utf8");
    const css = requiredMatch(html, /<style>([\s\S]*?)<\/style>/, "style block", relativePath);
    const body = requiredMatch(html, /<body[^>]*>([\s\S]*?)<script>/, "body block", relativePath);
    const script = requiredMatch(html, /<script>([\s\S]*?)<\/script>\s*<\/body>/, "script block", relativePath);

    return [
      slug,
      {
        css: replaceAssets(stripCssComments(css)).trim(),
        body: replaceAssets(stripHtmlComments(body)).trim(),
        script: stripJsComments(script).trim(),
      },
    ];
  }),
);

const output = `import type { VariantSlug } from "@/variants/registry";

type VariantDocumentSource = {
  css: string;
  body: string;
  script: string;
};

export const variantDocuments: Record<VariantSlug, VariantDocumentSource> = ${JSON.stringify(
  documents,
  null,
  2,
)};
`;

const outDir = path.join(root, "src/variants/generated");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "documents.ts"), output);
