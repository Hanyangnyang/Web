// 제휴 매장 데이터 모듈: 타입, 카테고리/단과대 메타, 검색·필터 헬퍼
import rawStores from '../../../data/partnerships.json';

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
  partnerships: Partnership[];
}

// JSON은 리터럴 타입으로 추론되므로 도메인 타입으로 캐스팅해 한 곳에서만 경계를 만든다
export const STORES = rawStores as unknown as PartnerStore[];

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

// 단과대 메타 (PartnershipView와 동일 — 리스트 뷰 삭제 시 이 파일이 단일 출처가 된다)
export const COLLEGE_EMOJI: Record<string, string> = {
  '1': '🦁', '2': '📢', '3': '⚙️', '4': '💊', '5': '🎨',
  '6': '🌍', '7': '📊', '8': '💻', '9': '🎵', '10': '🚀', '11': '👥',
};

export const COLLEGE_STYLE: Record<string, string> = {
  '1': 'bg-[rgba(254,215,170,0.5)] text-[#1f2937]',
  '2': 'bg-[rgba(254,202,202,0.5)] text-[#1f2937]',
  '3': 'bg-[rgba(229,231,235,0.6)] text-[#1f2937]',
  '4': 'bg-[rgba(254,226,226,0.5)] text-[#1f2937]',
  '5': 'bg-[rgba(233,213,255,0.5)] text-[#1f2937]',
  '6': 'bg-[rgba(187,247,208,0.5)] text-[#1f2937]',
  '7': 'bg-[rgba(254,240,138,0.5)] text-[#1f2937]',
  '8': 'bg-[rgba(191,219,254,0.5)] text-[#1f2937]',
  '9': 'bg-[rgba(251,207,232,0.5)] text-[#1f2937]',
  '10': 'bg-[rgba(254,215,170,0.5)] text-[#1f2937]',
  '11': 'bg-[rgba(219,234,254,0.6)] text-[#1f2937]',
};

export const COLLEGE_DISPLAY_NAME: Record<string, string> = {
  '1': 'LIONS\n칼리지',
  '6': '글로벌문화\n통상대학',
  '8': '소프트웨어\n융합대학',
};

/** 좌표가 있어 지도에 표시 가능한 매장인지 */
export function hasCoords(store: PartnerStore): boolean {
  return store.location?.latitude != null && store.location?.longitude != null;
}

/** 지도에 마커로 표시할 매장: 영업 중 + 좌표 보유 + 카테고리 일치 */
export function visibleStores(category: CategoryFilter): PartnerStore[] {
  return STORES.filter(
    (s) => s.is_active && hasCoords(s) && (category === 'all' || s.category === category)
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
export function searchStores(query: string): PartnerStore[] {
  const q = normalize(query.trim());
  if (!q) return [];
  return STORES.filter((s) => normalize(s.name).includes(q));
}

/** 검색 결과를 카테고리별로 그룹핑 — 결과 없는 카테고리는 제외 */
export function groupByCategory(stores: PartnerStore[]): { category: StoreCategory; stores: PartnerStore[] }[] {
  return CATEGORY_ORDER.map((category) => ({
    category,
    stores: stores.filter((s) => s.category === category),
  })).filter((g) => g.stores.length > 0);
}
