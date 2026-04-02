import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Playwright (and its transitive Node.js built-ins like 'net' and 'fs')
  // must never be bundled for the browser. Marking it as a server-external
  // package tells Next.js to leave it as a require() call at runtime instead
  // of attempting to inline it into the client bundle.
  serverExternalPackages: ["playwright", "playwright-core"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
