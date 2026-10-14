import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Served behind EC2 nginx at path /raven/ (existing app keeps /).
  // Keeps pages, assets, and the /api/v1 backend proxy under /raven.
  basePath: "/raven",
};

export default nextConfig;
