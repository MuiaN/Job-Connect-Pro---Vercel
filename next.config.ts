import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,

  // Prisma configuration
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
};

export default nextConfig;
