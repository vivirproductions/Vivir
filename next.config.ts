import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  turbopack: {
    root: process.cwd(),
  },
  // Next.js 16 blocks cross-origin requests to /_next/* dev resources by default, and
  // treats 127.0.0.1 as a DIFFERENT origin from localhost even on the same machine. That
  // silently breaks client bundle loading for any tool that connects via 127.0.0.1 (this
  // one included) - the server-rendered HTML still paints, so the page looks fine, but
  // React never hydrates and no client-side script (view switching, the Films tab
  // filter, the lightbox) ever runs. No console error either - the request is simply
  // blocked before the bundle is served.
  allowedDevOrigins: ["localhost", "127.0.0.1"],
};

export default nextConfig;
