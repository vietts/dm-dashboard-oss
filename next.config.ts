import type { NextConfig } from "next";

// Extract hostname from Supabase URL for image optimization
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseHostname = supabaseUrl ? new URL(supabaseUrl).hostname : '';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseHostname ? [
      {
        protocol: 'https',
        hostname: supabaseHostname,
        pathname: '/storage/v1/object/public/**',
      },
    ] : [],
  },
};

export default nextConfig;
