// 훅: 캠퍼스맵 필터 칩(매장 카테고리 + 건물/흡연장 레이어) · 단과대 필터 상태
import { useCallback, useState } from 'react';
import type { MapChip } from '../components/partnership/MapFilterChips.js';

const COLLEGE_FILTER_STORAGE_KEY = 'partnerCollegeFilter';

export function usePartnerMapFilters() {
  // 칩 하나만 선택 가능 (매장 카테고리 / 건물 / 흡연장), 다시 탭하면 해제되어 null(아무 표시 없음)이 될 수 있다.
  // '전체' 칩이 없어졌으므로 시작 상태도 미선택 — 사용자가 직접 칩을 골라야 지도에 뭔가 나타난다
  const [chip, setChip] = useState<MapChip | null>(null);
  // 단과대 필터 — 예전 리스트 뷰의 기능 승계, 같은 localStorage 키로 이어받는다
  const [college, setCollegeState] = useState(
    () => localStorage.getItem(COLLEGE_FILTER_STORAGE_KEY) || 'all'
  );

  const setCollege = useCallback((next: string) => {
    setCollegeState(next);
    localStorage.setItem(COLLEGE_FILTER_STORAGE_KEY, next);
  }, []);

  return { chip, setChip, college, setCollege };
}
