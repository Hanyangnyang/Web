import { useState } from 'react';

// 곡추천하기 화면에 처음 들어온 사용자에게 "하루 추천 한도" 안내 팝업을 한 번만 보여주기 위한 표시 — 기기(브라우저) 단위
const SEEN_STORAGE_KEY = 'hyu_recommend_limit_notice_seen_v1';

function hasSeenNotice(): boolean {
  try {
    return localStorage.getItem(SEEN_STORAGE_KEY) === '1';
  } catch {
    // localStorage 접근 불가(시크릿 모드 등)면 이미 본 걸로 처리 — 매번 팝업이 뜨는 것보다 안 뜨는 쪽이 덜 거슬림
    return true;
  }
}

export function useFirstRecommendNotice() {
  const [shouldShow, setShouldShow] = useState(() => !hasSeenNotice());

  const dismiss = () => {
    setShouldShow(false);
    try {
      localStorage.setItem(SEEN_STORAGE_KEY, '1');
    } catch {
      // 부가 안내라 저장 실패는 조용히 무시
    }
  };

  return { shouldShow, dismiss };
}
