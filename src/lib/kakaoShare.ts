// 카카오톡 공유 SDK를 실제로 필요할 때(ShareSheet 마운트 시)만 로드한다.
// 예전엔 index.html에서 항상 로드해서 공유를 한 번도 안 쓰는 사용자도 매번 다운로드했었음.
declare global {
  interface Window {
    Kakao?: {
      isInitialized: () => boolean;
      init: (key: string) => void;
      Share: {
        sendDefault: (options: Record<string, unknown>) => void;
      };
    };
    __kakaoStatus?: string;
  }
}

const KAKAO_SDK_URL = 'https://t1.kakaocdn.net/kakao_js_sdk/2.8.1/kakao.min.js';
const KAKAO_SDK_INTEGRITY = 'sha384-OL+ylM/iuPLtW5U3XcvLSGhE8JzReKDank5InqlHGWPhb4140/yrBw0bg0y7+C9J';

let loadPromise: Promise<void> | null = null;

// 여러 번 호출돼도 스크립트는 한 번만 삽입되도록 프로미스를 캐싱한다.
export function loadKakaoSdk(): Promise<void> {
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<void>((resolve, reject) => {
    const kakaoKey = import.meta.env.VITE_KAKAO_JS_KEY;
    if (!kakaoKey) {
      console.warn('[Kakao] VITE_KAKAO_JS_KEY 없음 — 카카오톡 공유 비활성화');
      window.__kakaoStatus = 'NO_KEY';
      reject(new Error('NO_KEY'));
      return;
    }

    if (window.Kakao?.isInitialized()) {
      window.__kakaoStatus = 'OK';
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = KAKAO_SDK_URL;
    script.integrity = KAKAO_SDK_INTEGRITY;
    script.crossOrigin = 'anonymous';
    script.onload = () => {
      if (!window.Kakao) {
        console.warn('[Kakao] SDK 로드 실패');
        window.__kakaoStatus = 'SDK_NOT_LOADED';
        reject(new Error('SDK_NOT_LOADED'));
        return;
      }
      try {
        if (!window.Kakao.isInitialized()) window.Kakao.init(kakaoKey);
        window.__kakaoStatus = 'OK';
        console.log('[Kakao] SDK 초기화 완료');
        resolve();
      } catch (e) {
        window.__kakaoStatus = 'INIT_ERROR';
        console.error('[Kakao] init 실패:', e);
        reject(e);
      }
    };
    script.onerror = () => {
      window.__kakaoStatus = 'SDK_NOT_LOADED';
      reject(new Error('SDK_NOT_LOADED'));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}
