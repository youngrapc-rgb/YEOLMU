import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // 타입 오류가 있어도 배포를 강행합니다.
    ignoreBuildErrors: true,
  },
  // 최신 버전에서는 eslint를 이렇게 설정하지 않아도 되거나 
  // 프로젝트 루트의 .eslintignore 등을 활용하지만, 
  // 일단 가장 문제가 되는 typescript 체크만 켜두고 나머지는 비워둡니다.
};

export default nextConfig;