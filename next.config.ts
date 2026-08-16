import type { NextConfig } from "next";

// Issue #2: Content-Security-Policy moved out of this static config. A nonce
// policy has to be built per request (src/proxy.ts generates the nonce and
// sets both the request header Next reads and the response header the
// browser enforces — see src/lib/csp.ts), and keeping the old static
// 'unsafe-inline' policy here would stack on top and negate it. The other
// security headers stay static.
const securityHeaders = [
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
