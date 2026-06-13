import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    turbo: {},
  },
  serverExternalPackages: ["pdf-parse", "pdfkit"],
};

export default nextConfig;
