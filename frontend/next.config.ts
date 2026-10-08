import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tailwind CSS v4 runs through Turbopack's CSS pipeline.
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
