/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true, // 타입 에러 무시
  },
  // eslint 설정을 제거하고 빌드 시 무시하는 다른 설정법
  eslint: {
    ignoreDuringBuilds: true,
  }
};

// 최신 Next.js 버전(15+)에서는 mjs 형식을 선호하므로 아래와 같이 내보냅니다.
export default nextConfig;