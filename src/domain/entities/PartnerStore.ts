// 도메인 엔티티: 제휴 매장
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
  latitude: number | null;
  longitude: number | null;
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

// raw 데이터를 도메인 엔티티로 변환 — 지금은 필드가 그대로 대응되지만,
// 나중에 백엔드 API가 다른 필드명/형식으로 내려줘도 이 함수만 고치면 나머지
// 도메인/프레젠테이션 로직은 안 바뀐다
export function createPartnerStore(raw: PartnerStore): PartnerStore {
  return {
    id: raw.id,
    name: raw.name,
    category: raw.category,
    is_active: raw.is_active,
    summary_benefit: raw.summary_benefit ?? null,
    location: {
      latitude: raw.location?.latitude ?? null,
      longitude: raw.location?.longitude ?? null,
      address: raw.location?.address ?? null,
      full_address: raw.location?.full_address ?? null,
    },
    emoji: raw.emoji,
    kakao_place_id: raw.kakao_place_id ?? null,
    partnerships: raw.partnerships ?? [],
  };
}

export function createPartnerStores(rawList: PartnerStore[]): PartnerStore[] {
  return rawList.map(createPartnerStore);
}

// ─── 메타데이터 ─────────────────────────────────────────────────────

// 에리카 정문 — 위치 권한이 없거나 캠퍼스에서 먼 사용자의 기본 지도 중심
export const ERICA_MAIN_GATE = { lat: 37.2983, lng: 126.8388 } as const;

export const CATEGORY_ORDER: StoreCategory[] = ['food', 'cafe', 'pub', 'play', 'life'];

export const CATEGORY_META: Record<StoreCategory, { label: string; emoji: string }> = {
  food: { label: '식당', emoji: '🍽️' },
  cafe: { label: '카페', emoji: '☕' },
  pub:  { label: '주점', emoji: '🍺' },
  play: { label: '여가', emoji: '🎮' },
  life: { label: '생활', emoji: '✂️' },
};

// 단과대 메타
export const COLLEGE_EMOJI: Record<string, string> = {
  '1': '🦁', '2': '📢', '3': '⚙️', '4': '💊', '5': '🎨',
  '6': '🌍', '7': '📊', '8': '💻', '9': '🎵', '10': '🚀', '11': '👥',
};

export const COLLEGE_DISPLAY_NAME: Record<string, string> = {
  '1': 'LIONS\n칼리지',
  '6': '글로벌문화\n통상대학',
  '8': '소프트웨어\n융합대학',
};

// 단과대 필터 드롭다운용 (총학생회는 별도 제휴 주체가 아니라 제외)
export const COLLEGES: { id: string; name: string }[] = [
  { id: '1', name: 'LIONS 칼리지' },
  { id: '2', name: '커뮤니케이션&컬쳐대학' },
  { id: '3', name: '공학대학' },
  { id: '4', name: '약학대학' },
  { id: '5', name: '디자인대학' },
  { id: '6', name: '글로벌문화통상대학' },
  { id: '7', name: '경상대학' },
  { id: '8', name: '소프트웨어융합대학' },
  { id: '9', name: '예체능대학' },
  { id: '10', name: '첨단융합대학' },
];

// ─── 도메인 로직 (매장 목록 필터·검색) ────────────────────────────────
// RQ 훅이 데이터를 소유하므로, 여기 함수들은 모두 stores를 파라미터로 받는다
// (예전 storeData.ts처럼 모듈 전역 STORES를 암묵적으로 참조하지 않는다)

/** 좌표가 있어 지도에 표시 가능한 매장인지 */
export function hasCoords(store: PartnerStore): boolean {
  return store.location?.latitude != null && store.location?.longitude != null;
}

/** 지도에 마커로 표시할 매장: 영업 중 + 좌표 보유 + 카테고리·단과대 필터 일치 */
export function visibleStores(
  stores: PartnerStore[],
  category: CategoryFilter,
  collegeId: string = 'all'
): PartnerStore[] {
  return stores.filter(
    (s) =>
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

/** 띄어쓰기·대소문자 무시 정규화 (데이터셋이 작아 실시간 연산 비용은 무시 가능) */
export function normalize(text: string): string {
  return text.replace(/\s+/g, '').toLowerCase();
}

/** 매장명 검색 — 폐업 매장도 포함해 반환한다 (검색은 "이 가게 제휴 되나?"에 답하는 기능이므로) */
export function searchStores(stores: PartnerStore[], query: string): PartnerStore[] {
  const q = normalize(query.trim());
  if (!q) return [];
  return stores.filter((s) => normalize(s.name).includes(q));
}

/** 검색 결과를 카테고리별로 그룹핑 — 결과 없는 카테고리는 제외 */
export function groupByCategory(stores: PartnerStore[]): { category: StoreCategory; stores: PartnerStore[] }[] {
  return CATEGORY_ORDER.map((category) => ({
    category,
    stores: stores.filter((s) => s.category === category),
  })).filter((g) => g.stores.length > 0);
}