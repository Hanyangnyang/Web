// 훅: 캠퍼스맵 필터 칩(매장 카테고리 + 건물/흡연장 레이어) · 단과대 필터 상태
import { useCallback, useState } from 'react';
import type { CategoryFilter } from '../../domain/entities/PartnerStore.js';

// 칩은 '시설 계열'(교내시설·오픈스페이스·흡연장)과 '매장 카테고리' 두 갈래다.
// 화면 곳곳에서 이 둘을 구분해야 해서 경계를 여기 한 곳에만 둔다.
// (칩 상태를 소유하는 훅이 타입도 갖는다 — 컴포넌트가 훅을 참조하는 방향이 자연스럽다)
const FACILITY_CHIPS = ['building', 'openspace', 'smoking'] as const;
type FacilityChip = (typeof FACILITY_CHIPS)[number];

export type MapChip = FacilityChip | CategoryFilter;

/** 매장 카테고리 칩이면 그 카테고리를, 시설 칩이거나 미선택이면 null */
export function toStoreCategory(chip: MapChip | null): CategoryFilter | null {
  if (!chip) return null;
  return (FACILITY_CHIPS as readonly string[]).includes(chip) ? null : (chip as CategoryFilter);
}

const COLLEGE_FILTER_STORAGE_KEY = 'partnerCollegeFilter';

export function usePartnerMapFilters() {
  // 칩 하나만 선택 가능 (전체 / 교내시설 / 오픈스페이스 / 흡연장 / 매장 카테고리),
  // 다시 탭하면 해제되어 null(아무 표시 없음)이 될 수 있다.
  // 진입 기본값은 '전체' — 모든 레이어가 보이되 바텀시트는 뜨지 않는 상태로 시작한다.
  const [chip, setChip] = useState<MapChip | null>('all');
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
