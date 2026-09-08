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

const pages = ["landing", "films", "studio"];

function requiredMatch(text, pattern, label, sourcePath) {
  const match = text.match(pattern);
  if (!match) {
    throw new Error(`Could not find ${label} in ${sourcePath}`);
  }
  return match[1];
}

function requiredBlock(text, name, sourcePath) {
  return requiredMatch(
    text,
    new RegExp(`<!-- split:${name}:start -->([\\s\\S]*?)<!-- split:${name}:end -->`),
    `split ${name} block`,
    sourcePath,
  );
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

function routeMarkup(text, slug, page) {
  const base = `/${slug}`;
  const currentPage = new RegExp(`(<a\\b[^>]*\\bdata-page="${page}"[^>]*)(>)`, "g");

  return text
    .replaceAll('href="index.html#top"', `href="${base}"`)
    .replaceAll('href="index.html#work"', `href="${base}#work"`)
    .replaceAll('href="films.html#', `href="${base}/films#`)
    .replaceAll('href="films.html"', `href="${base}/films"`)
    .replaceAll('href="studio.html"', `href="${base}/studio"`)
    .replace(currentPage, '$1 aria-current="page"$2');
}

const documents = Object.fromEntries(
  sources.map(([slug, relativePath]) => {
    const sourcePath = path.join(root, relativePath);
    const html = fs.readFileSync(sourcePath, "utf8");
    const css = requiredMatch(html, /<style>([\s\S]*?)<\/style>/, "style block", relativePath);
    const script = requiredMatch(html, /<script>([\s\S]*?)<\/script>\s*<\/body>/, "script block", relativePath);
    const shared = {
      header: requiredBlock(html, "header", relativePath),
      landing: requiredBlock(html, "landing", relativePath),
      films: requiredBlock(html, "films", relativePath),
      studio: requiredBlock(html, "studio", relativePath),
      lightbox: requiredBlock(html, "lightbox", relativePath),
      footer: requiredBlock(html, "footer", relativePath),
    };
    const bodyByPage = Object.fromEntries(
      pages.map((page) => {
        const body = shared.header + shared[page] + (page === "films" ? shared.lightbox : "") + shared.footer;
        return [page, replaceAssets(stripHtmlComments(routeMarkup(body, slug, page))).trim()];
      }),
    );

    return [
      slug,
      {
        css: replaceAssets(stripCssComments(css)).trim(),
        bodyByPage,
        script: stripJsComments(script).trim(),
      },
    ];
  }),
);

const output = `import type { VariantPage, VariantSlug } from "@/variants/registry";

type VariantDocumentSource = {
  css: string;
  bodyByPage: Record<VariantPage, string>;
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
