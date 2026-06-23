/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    const rawBackendUrl = process.env.BACKEND_URL || "http://127.0.0.1:8000";
    const backendUrl = rawBackendUrl.replace(/\/$/, "");
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      }
    ];
  },
};

module.exports = nextConfig;
