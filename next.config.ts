import { withReticle } from "@reticlehq/next";
import path from "node:path";
import { fileURLToPath } from "node:url";

import bundleAnalyzer from "@next/bundle-analyzer";
import type { NextConfig } from "next";

const dirname = path.dirname(fileURLToPath(import.meta.url));

const isDev = process.env.NODE_ENV !== "production";
// Served over https (production): http subresources are upgraded. Not on a production build
// served over http://localhost (CI, the local preview), where the upgrade would break every frame.
const isHttps = (process.env.NEXT_PUBLIC_SERVER_URL ?? "").startsWith("https://");

// Data sovereignty: the browser may only talk to this origin. Every third-party origin must be an
// explicit, reviewed addition here (and should be self-hosted or EU-hosted where possible).
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "media-src 'self' blob:",
  "font-src 'self' data:",
  `connect-src 'self'${isDev ? " ws://localhost:* http://localhost:* ws://127.0.0.1:* http://127.0.0.1:*" : ""}`,
  "frame-src 'self'",
  "worker-src 'self' blob:",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  ...(isHttps ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  typedRoutes: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    localPatterns: [{ pathname: "/media/**" }],
  },
  turbopack: { root: dirname },
  // Production runs `node server.js` from .next/standalone (Dockerfile): only the traced files ship.
  output: "standalone",
  // The share images read Geist from disk (components/site/share-image.tsx); tracing cannot see
  // those reads, so the fonts are shipped explicitly.
  outputFileTracingIncludes: {
    "/**": ["./node_modules/geist/dist/fonts/geist-sans/Geist-{Regular,SemiBold}.ttf"],
  },
  // Server actions carry forms and page content, never files: uploads have their own route
  // (admin/(app)/medien/hochladen). Small, since the public contact form is an action too.
  experimental: {
    optimizePackageImports: ["lucide-react", "date-fns", "motion"],
    serverActions: { bodySizeLimit: "2mb" },
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Uploads are data, never documents: opened directly, a file runs no script and cannot
      // reach this origin's cookies, whatever it turns out to contain. Listed last, so it wins.
      {
        source: "/media/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "sandbox; default-src 'none'; img-src 'self'; media-src 'self'",
          },
        ],
      },
    ];
  },
};

const withBundleAnalyzer = bundleAnalyzer({ enabled: process.env.ANALYZE === "true" });

export default withReticle(withBundleAnalyzer(nextConfig), { sourceMapping: false });
