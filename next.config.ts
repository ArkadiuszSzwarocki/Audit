import type { NextConfig } from "next";
import os from "os";

function getLocalDevOrigins(): string[] {
  const origins = new Set<string>([
    "localhost",
    "localhost:3000",
    "127.0.0.1",
    "127.0.0.1:3000",
    "0.0.0.0",
    "0.0.0.0:3000",
    "*.local",
    "*.lan",
    "192.168.*",
    "10.*",
    "172.*",
  ]);

  try {
    const interfaces = os.networkInterfaces();
    for (const netInterface of Object.values(interfaces)) {
      if (!netInterface) continue;
      for (const net of netInterface) {
        if (net.family === "IPv4" && !net.internal) {
          origins.add(net.address);
          origins.add(`${net.address}:3000`);
        }
      }
    }
  } catch {
    // fallback if OS network interface lookup fails
  }

  return Array.from(origins);
}

const nextConfig: NextConfig = {
  allowedDevOrigins: getLocalDevOrigins(),
};

export default nextConfig;
