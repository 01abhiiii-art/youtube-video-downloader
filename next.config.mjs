/** @type {import('next').NextConfig} */
const apiHostport = process.env.API_INTERNAL_HOSTPORT;
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    if (!apiHostport) return [];
    return [
      {
        source: "/api/:path*",
        destination: `http://${apiHostport}/:path*`,
      },
    ];
  },
};
export default nextConfig;
