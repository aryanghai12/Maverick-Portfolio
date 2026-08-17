/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export: there is no server at runtime, so the entire class of
  // server-side advisories simply does not apply to what gets deployed.
  output: 'export',
  images: { unoptimized: true },
  reactStrictMode: true,
};

export default nextConfig;
