/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
          {
            protocol: 'https',
            hostname: 'scontent-lga3-2.cdninstagram.com, upload.wikimedia.org',
          },
          {
            protocol: 'https',
            hostname: 'upload.wikimedia.org',
          },
        ],
      },
      reactStrictMode: false
};

export default nextConfig;
