// 훅: 캠퍼스맵 필터 칩 · 단과대 필터 상태
import { useCallback, useState } from 'react';
import type { CategoryFilter, StoreCategory } from '../../domain/entities/PartnerStore.js';

// 칩은 세 갈래다 — '전체'(모든 레이어) · 시설 종류 · 매장 카테고리.
// 화면 곳곳에서 이 셋을 구분해야 해서 경계를 여기 한 곳에만 둔다.
// FacilityKind ↔ StoreCategory로 접미사를 맞춰, 둘이 같은 층위의 '종류'임을 이름으로 드러낸다.
const FACILITY_KINDS = ['building', 'openspace', 'smoking'] as const;
type FacilityKind = (typeof FACILITY_KINDS)[number];

// 'all'은 union에 직접 쓴다. 예전엔 CategoryFilter('all' | StoreCategory)를 통째로 넣어
// 'all'이 매장 카테고리인 척 섞여 들어왔는데, 실제로는 모든 레이어를 한꺼번에 켜는 전역 모드다.
// 그래서 이 파일만 봐서는 'all'이 어디서 온 값인지 보이지 않았다.
export type MapChip = 'all' | FacilityKind | StoreCategory;

function isFacilityKind(chip: MapChip): chip is FacilityKind {
  return (FACILITY_KINDS as readonly string[]).includes(chip);
}

/**
 * 매장 목록을 뜻하는 칩이면 그 카테고리를, 시설 칩이거나 미선택이면 null.
 * '전체'는 모든 카테고리를 뜻하므로 'all'이 그대로 나간다.
 */
export function toStoreCategory(chip: MapChip | null): CategoryFilter | null {
  if (!chip) return null;
  // 타입 가드라 else 가지가 'all' | StoreCategory(= CategoryFilter)로 저절로 좁혀진다 — 단언이 필요 없다
  return isFacilityKind(chip) ? null : chip;
}

const COLLEGE_FILTER_STORAGE_KEY = 'partnerCollegeFilter';

export function usePartnerMapFilters() {
  // 칩 하나만 선택 가능 (전체 / 교내시설 / 오픈스페이스 / 흡연장 / 매장 카테고리),
  // 다시 탭하면 해제되어 null(아무 표시 없음)이 될 수 있다.
  // 진입 기본값은 '전체' — 모든 레이어가 보이되 바텀시트는 뜨지 않는 상태로 시작한다.
  
  // 현재 켜진 칩 상태 
  const [chip, setChip] = useState<MapChip | null>('all');
  // 단과대 필터 상태 
  const [college, setCollegeState] = useState(
    () => localStorage.getItem(COLLEGE_FILTER_STORAGE_KEY) || 'all'
  );

  const setCollege = useCallback((next: string) => {
    setCollegeState(next);
    localStorage.setItem(COLLEGE_FILTER_STORAGE_KEY, next);
  }, []);

  return { chip, setChip, college, setCollege };
}
