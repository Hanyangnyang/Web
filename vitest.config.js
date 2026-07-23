import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// vite.config.js와 분리한 이유:
// 앱 빌드용 설정에는 PWA(서비스워커 생성)·Sentry(소스맵 업로드)·api-emulator 플러그인이 붙어 있는데,
// 유닛 테스트는 훅/함수 단위 실행이라 이것들이 전부 불필요하고 느려지거나 부작용(외부 업로드)을 일으킬 수 있다.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',        // localStorage·DOM API를 Node에서 흉내
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.test.{js,jsx}'],
  },
});
