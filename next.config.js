/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // 빌드 시 타입 체크 오류가 있어도 배포를 진행하게 합니다.
    ignoreBuildErrors: true,
  },
  eslint: {
    // 빌드 시 문법 오류가 있어도 배포를 진행하게 합니다.
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;