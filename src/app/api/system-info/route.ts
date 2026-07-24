import { NextResponse } from 'next/server';
import os from 'os';

export async function GET() {
  try {
    const hostname = os.hostname();
    const interfaces = os.networkInterfaces();
    const ips: { name: string; ip: string; url: string }[] = [];

    for (const [name, netInterface] of Object.entries(interfaces)) {
      if (!netInterface) continue;
      for (const net of netInterface) {
        // Only IPv4 and non-internal (skip 127.0.0.1)
        if (net.family === 'IPv4' && !net.internal) {
          ips.push({
            name,
            ip: net.address,
            url: `http://${net.address}:3000`,
          });
        }
      }
    }

    const cleanHost = hostname.toLowerCase();
    const hostnameUrl = `http://${cleanHost}:3000`;
    const mDnsUrl = `http://${cleanHost}.local:3000`;

    return NextResponse.json({
      localUrl: 'http://localhost:3000',
      hostname,
      hostnameUrl,
      mDnsUrl,
      networkAddresses: ips,
      primaryUrl: ips.length > 0 ? ips[0].url : 'http://localhost:3000',
    });
  } catch (error: any) {
    return NextResponse.json({
      localUrl: 'http://localhost:3000',
      hostname: 'localhost',
      hostnameUrl: 'http://localhost:3000',
      mDnsUrl: 'http://localhost:3000',
      networkAddresses: [],
      primaryUrl: 'http://localhost:3000',
      error: error.message,
    });
  }
}
