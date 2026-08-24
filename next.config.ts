import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    'sandeepupadhyay.dev',
    '*.sandeepupadhyay.dev',
    'nycu.sandeepupadhyay.dev',
    'aiinnovationcoalition.org',
    '*.aiinnovationcoalition.org',
    'localhost:3007',
    '127.0.0.1:3007'
  ]
};

export default nextConfig;

