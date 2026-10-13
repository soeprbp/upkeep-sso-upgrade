import { fileURLToPath } from 'node:url';

const scriptPolicy = process.env.NODE_ENV === 'production'
  ? "script-src 'self' 'unsafe-inline'"
  : "script-src 'self' 'unsafe-inline' 'unsafe-eval'";

/** @type {import('next').NextConfig} */
const nextConfig = {
  agentRules: false,
  allowedDevOrigins: ['127.0.0.1'],
  output: 'standalone',
  typedRoutes: true,
  outputFileTracingRoot: fileURLToPath(new URL('.', import.meta.url)),
  async headers() {
    return [{
      source: '/:path*',
      headers: [{
        key: 'Content-Security-Policy',
        value: `default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; img-src 'self' data:; font-src 'self'; style-src 'self' 'unsafe-inline'; ${scriptPolicy}; connect-src 'self'`
      }]
    }];
  }
};

export default nextConfig;
