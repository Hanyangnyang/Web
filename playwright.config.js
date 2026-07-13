import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    // 셔틀 탭 측위를 결정적으로 만들기 위한 가짜 GPS (ERICA 캠퍼스 좌표)
    geolocation: { latitude: 37.2973, longitude: 126.8372 },
    permissions: ['geolocation'],
  },
  projects: [
    // 하냥냥은 모바일 웹뷰 앱이므로 모바일 뷰포트로 테스트
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
