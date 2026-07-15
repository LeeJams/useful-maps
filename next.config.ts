import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  trailingSlash: true,
  async headers() {
    return [
      {
        source: "/service-worker/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/service-worker/" }
        ]
      }
    ];
  }
};

export default nextConfig;
