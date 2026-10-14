import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep pages, assets, and the /api/v1 backend proxy under /raven so this
  // app can use its own host port without changing another app's routing.
  basePath: "/raven",
};

export default nextConfig;
