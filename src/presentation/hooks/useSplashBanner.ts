// 스플래시 화면 하단에 띄울 배너 — 소식 탭 배너 API 응답을 캐싱해두고 재사용한다.
// 스플래시는 부팅 초기(useBanners가 아직 fetch도 안 한 시점)에 뜨므로, 그 순간엔 네트워크 응답을
// 기다릴 수 없다. 그래서 "이전 세션에 성공적으로 받아온 배너 목록"을 localStorage에 남겨뒀다가,
// 다음 부팅 스플래시에서 displayOrder가 가장 앞선 배너를 즉시 보여준다. 캐시가 없는 최초 진입자에게는 아예 안 띄운다.
import { useState } from 'react';
import type { Banner } from '../../domain/entities/Banner.js';

const SPLASH_BANNER_CACHE_KEY = 'splashBannerCache';

export function cacheBannersForSplash(banners: Banner[]) {
  try {
    if (banners.length) {
      localStorage.setItem(SPLASH_BANNER_CACHE_KEY, JSON.stringify(banners));
    } else {
      localStorage.removeItem(SPLASH_BANNER_CACHE_KEY);
    }
  } catch {
    // localStorage 접근 불가(프라이빗 모드 등)해도 스플래시 배너는 있으면 좋은 정도라 조용히 무시
  }
}

// 이 브랜치(feat/pepero-flower-promo) 전용: 빼빼로데이 프로모션 배너 고정 노출
const PEPERO_SPLASH_BANNER: Banner = {
  id: -1111,
  imageUrl: '/assets/promo/pepero-playlist-banner.jpg',
  clickUrl: '',
  altText: '빼빼로데이엔 꽃으로 마음을 전해요',
  displayOrder: 0,
  placement: 'BOTH',
};

export function useSplashBanner(): Banner | null {
  // 이 브랜치에서는 빼빼로데이 프로모션 배너를 고정으로 노출
  return PEPERO_SPLASH_BANNER;
}
