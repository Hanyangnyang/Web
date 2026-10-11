/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0E4A84',
          glow: 'rgba(14, 74, 132, 0.2)',
        },
        secondary: '#AB863F',
        success: {
          DEFAULT: '#27AE60',
          dark: '#1a7a42',
        },
        warning: {
          DEFAULT: '#F39C12',
          dark: '#9a6200',
        },
        error: '#ef4444',
        surface: '#F8F9FA',
        'text-main': '#212529',
        'text-sub': '#6C757D',
        'text-hint': '#94a3b8',
        'hyu-blue-light': '#3b82f6',
        // 플레이리스트 기능 전용 강조색 — 여러 컴포넌트에 하드코딩된 채로 반복되던 값을 토큰화
        'playlist-primary': '#618CE9', // 검색/공유/정렬 등 대부분의 강조 요소
        'playlist-accent': '#8B5CF6', // 곡 추천하기 FAB 등 "새 곡 추천" 액션 전용 포인트 컬러
      },
      borderRadius: {
        card: '12px',
      },
      maxWidth: {
        app: '440px',
      },
      fontFamily: {
        sans: ['Pretendard', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
