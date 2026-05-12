/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // 타입 오류 무시는 유지합니다.
    ignoreBuildErrors: true,
  },
  // eslint 부분은 아예 삭제했습니다.
};

export default nextConfig;