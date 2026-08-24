// 도메인 엔티티: 제휴 매장
import { normalizeForSearch, matchesQuery } from '../../lib/searchText.js';
import type { Coordinates } from './Coordinates.js';

export type StoreCategory = 'food' | 'cafe' | 'pub' | 'play' | 'life';
export type CategoryFilter = 'all' | StoreCategory;

export interface PartnershipPeriod {
  startDate?: string | null;
  endDate?: string | null;
  isActive: boolean;
}

export interface Partnership {
  collegeId: string;
  collegeName: string;
  benefit?: string | null;
  period?: PartnershipPeriod | null;
  conditions?: string | null;
  sourceUrl?: string | null;
}

export interface StoreLocation {
  coordinates: Coordinates | null;
  address: string | null;
  fullAddress: string | null;
}

export interface PartnerStore {
  id: string;
  name: string;
  category: StoreCategory;
  isActive: boolean;
  summaryBenefit?: string | null;
  location: StoreLocation;
  emoji?: string;
  kakaoPlaceId?: string | null;
  partnerships: Partnership[];
}

export const CATEGORY_ORDER: StoreCategory[] = ['food', 'cafe', 'pub', 'play', 'life'];
export const CATEGORY_META: Record<StoreCategory, { label: string; emoji: string }> = {
  food: { label: '식당', emoji: '🍽️' },
  cafe: { label: '카페', emoji: '☕' },
  pub:  { label: '주점', emoji: '🍺' },
  play: { label: '여가', emoji: '🎮' },
  life: { label: '생활', emoji: '✂️' },
};

export type PlottableStore = PartnerStore & { location: { coordinates: Coordinates } };

export function hasCoords(store: PartnerStore): store is PlottableStore {
  return store.location.coordinates !== null;
}

// 활성화된 매장 중 좌표가 있는 것만 반환 — 카테고리·대학 필터링 가능
export function visibleStores(
  stores: PartnerStore[],
  category: CategoryFilter,
  collegeId: string = 'all'
): PlottableStore[] {
  return stores.filter(
    (s): s is PlottableStore =>
      s.isActive &&
      hasCoords(s) &&
      (category === 'all' || s.category === category) &&
      (collegeId === 'all' ||
        s.partnerships.some((p) => p.collegeId === collegeId && p.period?.isActive))
  );
}

// 활성화된 제휴만 반환 — 같은 대학이 여러 개 있으면 첫 번째만 남긴다
export function activePartnerships(store: PartnerStore): Partnership[] {
  const seen = new Set<string>();
  return store.partnerships.filter((p) => {
    if (!p.period?.isActive || seen.has(p.collegeId)) return false;
    seen.add(p.collegeId);
    return true;
  });
}

// 검색어에 맞는 매장만 반환 — 이름만 검색, 공백 제거·소문자화·한글 자모 분리
export function searchStores(stores: PartnerStore[], query: string): PartnerStore[] {
  const q = normalizeForSearch(query.trim());
  if (!q) return [];
  return stores.filter((s) => matchesQuery(s.name, q));
}

// 카테고리별로 그룹핑 — 카테고리 순서는 CATEGORY_ORDER에 따름, 비어 있는 카테고리는 제외
export function groupByCategory(stores: PartnerStore[]): { category: StoreCategory; stores: PartnerStore[] }[] {
  return CATEGORY_ORDER.map((category) => ({
    category,
    stores: stores.filter((s) => s.category === category),
  })).filter((g) => g.stores.length > 0);
}