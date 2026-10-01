import { ExitWarningBannerView } from './ExitWarningBanner.jsx';

// 실제 앱에서는 2초 뒤 사라지는 배너를 계속 띄워 두고 위치·색·글씨를 확인한다.
// 하단 네비게이션(높이 64px, 하단 여백 24px)을 흉내 낸 막대로 배너와의 간격을 가늠한다.
const withBottomNavMock = (Story: React.ComponentType) => (
  <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
    <Story />
    <div
      style={{ position: 'fixed', left: 16, right: 16, bottom: 24, height: 64, borderRadius: 32, background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.12)' }}
    />
  </div>
);

export default {
  title: '공통/ExitWarningBanner',
  component: ExitWarningBannerView,
  parameters: { layout: 'fullscreen' },
  decorators: [withBottomNavMock],
};

export const 기본 = {};
