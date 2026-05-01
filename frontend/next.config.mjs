/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@sorts/shared'],
  async redirects() {
    return [
      { source: '/create', destination: '/studio/create', permanent: true },
      { source: '/dashboard', destination: '/studio', permanent: true },
      { source: '/community/:cid', destination: '/app/:cid/feed', permanent: true },
      { source: '/link', destination: '/role', permanent: true },
      { source: '/discover', destination: '/role', permanent: true },
    ];
  },
};

export default nextConfig;
