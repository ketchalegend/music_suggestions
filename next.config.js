/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['supports-color', '@vercel/kv'],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        supports: false,
      };
    }
    return config;
  },
  images: {
    domains: ['imgs.search.brave.com'], // Add external domains here
  },
};

module.exports = nextConfig;
