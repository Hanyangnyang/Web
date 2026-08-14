import type { ComponentType } from 'react';
import { BannerCarousel } from './BannerCarousel.jsx';
import type { Banner } from '../../../domain/entities/Banner.js';

// ── mock 데이터 생성기 ─────────────────────────────────────────────
// 외부 이미지를 쓰면 네트워크가 없을 때 스토리가 깨지므로 SVG를 data URI로 만들어 쓴다.
// 캐러셀이 넘어가는 게 보이도록 배너마다 색과 문구를 다르게 준다.
const bannerImage = (label: string, color: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="150">
       <rect width="100%" height="100%" fill="${color}"/>
       <text x="50%" y="50%" fill="#ffffff" font-family="sans-serif" font-size="30" font-weight="bold"
             text-anchor="middle" dominant-baseline="middle">${label}</text>
     </svg>`
  )}`;

function makeBanner(id: number, label: string, color: string, clickUrl = 'https://example.com'): Banner {
  return {
    id,
    imageUrl: bannerImage(label, color),
    clickUrl,
    altText: label,
    displayOrder: id,
  };
}

const THREE_BANNERS = [
  makeBanner(1, '배너 1', '#0e4a84'),
  makeBanner(2, '배너 2', '#2563eb'),
  makeBanner(3, '배너 3', '#7c3aed'),
];

const CARD_WIDTH = 375;

const mobileFrame = (Story: ComponentType) => (
  <div style={{ maxWidth: `${CARD_WIDTH}px`, margin: '0 auto', padding: '16px' }}>
    <Story />
  </div>
);

// 아무것도 그리지 않는 상태를 눈으로 확인하기 위한 틀 — 점선 안이 비어 있으면 정상
const emptyFrame = (Story: ComponentType) => (
  <div style={{ maxWidth: `${CARD_WIDTH}px`, margin: '0 auto', padding: '16px' }}>
    <div style={{ border: '1px dashed #cbd5e1', borderRadius: '8px', padding: '12px' }}>
      <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 8px' }}>
        ↓ 이 안에 아무것도 그리지 않는 것이 정상 (배너는 없어도 그만인 영역)
      </p>
      <Story />
    </div>
  </div>
);

export default {
  title: '소식탭/BannerCarousel',
  component: BannerCarousel,
};

// ── 상태 분기 전수 ────────────────────────────────────────────────

export const 로딩중 = {
  decorators: [mobileFrame],
  args: { banners: [], loading: true },
};

// 배너가 0개면 null을 반환해 영역 자체가 사라진다.
// 학정 혼잡도·날씨와 달리 안내 문구를 띄우지 않는 이유는, 배너는 원래 없을 수도 있는 영역이라
// "불러오지 못했습니다"가 뜨면 오히려 없던 문제를 알리는 꼴이 되기 때문.
export const 배너없음 = {
  decorators: [emptyFrame],
  args: { banners: [], loading: false },
};

// 조회에 실패해도 배너없음과 똑같이 조용히 사라진다 (error prop을 화면에 쓰지 않는다)
export const 조회실패 = {
  decorators: [emptyFrame],
  args: { banners: [], loading: false, error: new Error('network error') },
};

// 한 장이면 자동 넘김 타이머가 돌아도 항상 같은 배너가 보인다
export const 한장 = {
  decorators: [mobileFrame],
  args: { banners: [THREE_BANNERS[0]], loading: false },
};

// 5초마다 자동 전환 + 좌우 스와이프(터치)·드래그(마우스)로 넘길 수 있다
export const 여러장 = {
  decorators: [mobileFrame],
  args: { banners: THREE_BANNERS, loading: false },
};

// clickUrl이 없으면 커서가 pointer로 바뀌지 않고 눌러도 아무 일도 일어나지 않는다
export const 클릭불가 = {
  decorators: [mobileFrame],
  args: { banners: [makeBanner(1, '링크 없는 배너', '#475569', '')], loading: false },
};
