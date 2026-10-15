import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Demo MVP uses a mutable in-memory store; cacheComponents conflicts with
  // force-dynamic and would freeze import history at build time.
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
