import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse", "pdfkit"],
  outputFileTracingExcludes: {
    "*": [
      "node_modules/pdf-parse/**",
      "node_modules/pdfkit/**",
    ],
  },
};

export default nextConfig;