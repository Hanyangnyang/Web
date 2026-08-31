// 스플래시 화면 하단에 띄울 배너 — 소식 탭 배너 API 응답을 캐싱해두고 재사용한다.
// 스플래시는 부팅 초기(useBanners가 아직 fetch도 안 한 시점)에 뜨므로, 그 순간엔 네트워크 응답을
// 기다릴 수 없다. 그래서 "이전 세션에 성공적으로 받아온 배너 목록"을 localStorage에 남겨뒀다가,
// 다음 부팅 스플래시에서 그중 하나를 무작위로 즉시 보여준다. 캐시가 없는 최초 진입자에게는 아예 안 띄운다.
import { useState } from 'react';
import type { Banner } from '../../domain/entities/Banner.js';

const SPLASH_BANNER_CACHE_KEY = 'splashBannerCache';

export function cacheBannersForSplash(banners: Banner[]) {
  if (!banners.length) return;
  try {
    localStorage.setItem(SPLASH_BANNER_CACHE_KEY, JSON.stringify(banners));
  } catch {
    // localStorage 접근 불가(프라이빗 모드 등)해도 스플래시 배너는 있으면 좋은 정도라 조용히 무시
  }
}

export function useSplashBanner(): Banner | null {
  // 무작위 선택은 스플래시가 뜬 시점(마운트)에 한 번만 — 리렌더마다 배너가 바뀌면 안 되므로 lazy init으로 고정
  const [banner] = useState<Banner | null>(() => {
    try {
      const raw = localStorage.getItem(SPLASH_BANNER_CACHE_KEY);
      if (!raw) return null;
      const cached = JSON.parse(raw);
      if (!Array.isArray(cached) || cached.length === 0) return null;
      return cached[Math.floor(Math.random() * cached.length)];
    } catch {
      return null;
    }
  });
  return banner;
}
