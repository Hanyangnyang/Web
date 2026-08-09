// 도메인 엔티티: 제휴 매장
import { normalizeForSearch, matchesQuery } from '../../lib/text.js';
import type { Coordinates } from './Coordinates.js';

export type StoreCategory = 'food' | 'cafe' | 'pub' | 'play' | 'life';
export type CategoryFilter = 'all' | StoreCategory;

export interface PartnershipPeriod {
  start_date?: string | null;
  end_date?: string | null;
  is_active: boolean;
}

export interface Partnership {
  college_id: string;
  college_name: string;
  benefit?: string | null;
  period?: PartnershipPeriod | null;
  conditions?: string | null;
  source_url?: string | null;
}

export interface StoreLocation {
  // 좌표는 통째로 있거나 없거나 둘 중 하나다.
  // 예전엔 latitude·longitude를 각각 nullable로 뒀는데, "위도만 있고 경도는 없는" 불가능한 상태가
  // 타입상 표현돼 쓰는 쪽마다 두 번씩 null 검사를 해야 했다.
  coordinates: Coordinates | null;
  address: string | null;
  full_address: string | null;
}

export interface PartnerStore {
  id: string;
  name: string;
  category: StoreCategory;
  is_active: boolean;
  summary_benefit?: string | null;
  location: StoreLocation;
  emoji?: string;
  kakao_place_id?: string | null;
  partnerships: Partnership[];
}

// ─── 메타데이터 ─────────────────────────────────────────────────────

export const CATEGORY_ORDER: StoreCategory[] = ['food', 'cafe', 'pub', 'play', 'life'];

export const CATEGORY_META: Record<StoreCategory, { label: string; emoji: string }> = {
  food: { label: '식당', emoji: '🍽️' },
  cafe: { label: '카페', emoji: '☕' },
  pub:  { label: '주점', emoji: '🍺' },
  play: { label: '여가', emoji: '🎮' },
  life: { label: '생활', emoji: '✂️' },
};

// 단과대 메타(id·이름·이모지)는 제휴 매장만의 지식이 아니라 학교 공통이라 College.ts로 옮겼다.

// ─── 도메인 로직 (매장 목록 필터·검색) ────────────────────────────────
// RQ 훅이 데이터를 소유하므로, 여기 함수들은 모두 stores를 파라미터로 받는다
// (예전 storeData.ts처럼 모듈 전역 STORES를 암묵적으로 참조하지 않는다)

/** 지도에 찍을 수 있는(좌표를 가진) 매장. 타입 가드라 통과하면 coordinates가 non-null로 좁혀진다 */
export type PlottableStore = PartnerStore & { location: { coordinates: Coordinates } };

export function hasCoords(store: PartnerStore): store is PlottableStore {
  return store.location.coordinates !== null;
}

/**
 * 지도에 마커로 표시할 매장: 영업 중 + 좌표 보유 + 카테고리·단과대 필터 일치.
 * 좌표를 거른 뒤이므로 반환 타입도 PlottableStore로 좁혀 준다 — 쓰는 쪽이 다시 null 검사를 하지 않아도 된다.
 */
export function visibleStores(
  stores: PartnerStore[],
  category: CategoryFilter,
  collegeId: string = 'all'
): PlottableStore[] {
  return stores.filter(
    (s): s is PlottableStore =>
      s.is_active &&
      hasCoords(s) &&
      (category === 'all' || s.category === category) &&
      (collegeId === 'all' ||
        s.partnerships.some((p) => p.college_id === collegeId && p.period?.is_active))
  );
}

/** 현재 유효한 제휴만, 단과대 중복 제거 */
export function activePartnerships(store: PartnerStore): Partnership[] {
  const seen = new Set<string>();
  return store.partnerships.filter((p) => {
    if (!p.period?.is_active || seen.has(p.college_id)) return false;
    seen.add(p.college_id);
    return true;
  });
}

/** 매장명 검색 — 폐업 매장도 포함해 반환한다 (검색은 "이 가게 제휴 되나?"에 답하는 기능이므로) */
export function searchStores(stores: PartnerStore[], query: string): PartnerStore[] {
  const q = normalizeForSearch(query.trim());
  if (!q) return [];
  return stores.filter((s) => matchesQuery(s.name, q));
}

/** 검색 결과를 카테고리별로 그룹핑 — 결과 없는 카테고리는 제외 */
export function groupByCategory(stores: PartnerStore[]): { category: StoreCategory; stores: PartnerStore[] }[] {
  return CATEGORY_ORDER.map((category) => ({
    category,
    stores: stores.filter((s) => s.category === category),
  })).filter((g) => g.stores.length > 0);
}