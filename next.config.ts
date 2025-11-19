import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,

  // Prisma configuration
  serverExternalPackages: ['@prisma/client'],
};

export default nextConfig;
