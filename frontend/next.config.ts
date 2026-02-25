import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  // Force rebuild to pick up NEXT_PUBLIC_API_URL
};

export default nextConfig;
