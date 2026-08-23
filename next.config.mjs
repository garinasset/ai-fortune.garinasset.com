/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "api.dicebear.com" },
      { protocol: "https", hostname: "api.qrserver.com" },
    ],
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ["**/node_modules/**", "**/.git/**"],
      };
    }
    return config;
  },
  async redirects() {
    return [
      { source: "/bazi", destination: "/lifekline", permanent: false },
      { source: "/chart", destination: "/lifekline", permanent: false },
      { source: "/palm", destination: "/xiang", permanent: false },
      { source: "/face", destination: "/xiang", permanent: false },
      { source: "/settings", destination: "/", permanent: false },
    ];
  },
};

export default nextConfig;
