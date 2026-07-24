import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "localhost:3000",
    "127.0.0.1:3000",
    "192.168.0.19",
    "192.168.0.19:3000",
    "*.local",
  ],
};

export default nextConfig;
