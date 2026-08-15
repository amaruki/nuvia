import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";

const contentSecurityPolicy = [
  "default-src 'self'",
  // Next.js's dev overlay and hydration bootstrap need 'unsafe-eval' only in
  // development; production builds don't.
  `script-src 'self'${isProduction ? "" : " 'unsafe-eval'"} 'unsafe-inline'`,
  // Radix/shadcn components set inline style attributes at runtime.
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  // TypeScript 7 doesn't expose the compiler API Next.js's own build-time
  // type-check step expects from TS <7 — this makes it use `tsc` as a CLI
  // subprocess instead. See https://nextjs.org/docs/messages/typescript-cli
  experimental: {
    useTypeScriptCli: true,
  },
  turbopack: {
    root: __dirname,
  },
  // Next.js blocks dev resources (HMR, on-demand chunks) requested from an
  // origin that differs from the bound hostname, serving 403s that leave the
  // page stuck on its SSR shell — e.g. browsing via http://127.0.0.1:3000
  // while the dev server is bound to localhost. Allow the usual local
  // spellings so any of them hydrate. Dev-only: ignored in production.
  allowedDevOrigins: ["localhost", "127.0.0.1", "*.localhost", "192.168.*.*"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
      // Placeholder photography for the landing page until real brand
      // photography exists.
      { protocol: "https", hostname: "picsum.photos" },
      // OAuth avatar hosts — keep in sync with socialProviders in
      // src/lib/auth/core.ts. Google OAuth profile photos (only Google is
      // configured today; add the GitHub/LinkedIn hosts when those land).
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
