import path from 'path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { dev, isServer }) => {
    // Add resolve fallback for node modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };

    // Limit webpack to only scan the project directory
    config.resolve.modules = [
      path.resolve('./node_modules'),
      path.resolve('./src'),
      'node_modules'
    ];

    // Exclude system directories from being scanned
    config.module = {
      ...config.module,
      exprContextCritical: false,
    };

    return config;
  },
  // Explicitly set the base path to current directory
  basePath: ''
};

export default nextConfig;
