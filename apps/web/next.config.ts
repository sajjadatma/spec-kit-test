import type { NextConfig } from "next";
const nextConfig: NextConfig = { async rewrites() { return [{ source: "/api/:path*", destination: `${process.env.API_ORIGIN ?? "http://localhost:3001/api/v1"}/:path*` }]; } };
export default nextConfig;
