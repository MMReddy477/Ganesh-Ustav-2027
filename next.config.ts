import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  outputFileTracingIncludes: {
    "/api/receipt/image": [
      "./public/fonts/noto-sans-latin-400.woff",
      "./public/fonts/noto-sans-telugu-400.woff",
      "./public/fonts/noto-sans-devanagari-400.woff",
      "./public/fonts/noto-sans-gujarati-400.woff",
    ],
    "/api/receipt/pdf": [
      "./public/fonts/noto-sans-latin-400.woff",
      "./public/fonts/noto-sans-telugu-400.woff",
      "./public/fonts/noto-sans-devanagari-400.woff",
      "./public/fonts/noto-sans-gujarati-400.woff",
    ],
  },
};

export default nextConfig;
