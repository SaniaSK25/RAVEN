import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep pages, assets, and the /api/v1 backend proxy under /raven so this
  // app can use its own host port without changing another app's routing.
  basePath: "/raven",

  // The Next dev server prints the bare host URL, but the app is mounted under
  // /raven. Redirect the host root there so opening localhost works too.
  async redirects() {
    return [
      {
        source: "/",
        destination: "/raven",
        basePath: false,
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
