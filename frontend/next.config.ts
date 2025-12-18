import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true, // Required for static export
  },
  // Trailing slash helps with some static hosts
  trailingSlash: true,
};

export default nextConfig;
