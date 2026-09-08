import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Vivir Color Review",
    template: "%s | Vivir Color Review",
  },
  description: "Review selector for the approved Vivir color directions.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* Archivo, weights 200/300/400 only - matches the film-v* pages exactly. Loaded
            once here rather than per-page: extract-variants.mjs only captures each
            prototype's <style> and body content, not its own <head> <link> tags, so
            without this the variant routes silently fall back to system-ui. */}
        <link
          href="https://fonts.googleapis.com/css2?family=Archivo:wght@200;300;400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
