import { describe, it, expect } from 'vitest';
import {
  hasCoords, visibleStores, activePartnerships, searchStores, groupByCategory,
  type PartnerStore, type Partnership,
} from './PartnerStore.js';

function partnership(overrides: Partial<Partnership> = {}): Partnership {
  return {
    partnershipId: 1,
    collegeId: '3',
    collegeName: '공학대학',
    benefit: '10% 할인',
    period: { isActive: true },
    ...overrides,
  };
}

function store(overrides: Partial<PartnerStore> = {}): PartnerStore {
  return {
    id: 'store-1',
    name: '테스트식당',
    category: 'food',
    isActive: true,
    summaryBenefit: null,
    location: { coordinates: { latitude: 37.3, longitude: 126.83 }, address: null, fullAddress: null },
    kakaoPlaceId: null,
    partnerships: [partnership()],
    ...overrides,
  };
}

describe('hasCoords', () => {
  it('좌표가 null이면 지도에 표시할 수 없다', () => {
    expect(hasCoords(store())).toBe(true);
    expect(hasCoords(store({ location: { coordinates: null, address: null, fullAddress: null } }))).toBe(false);
  });
});

describe('visibleStores', () => {
  it('폐업 매장과 좌표 없는 매장은 지도에서 뺀다', () => {
    const list = [
      store({ id: 'ok' }),
      store({ id: 'closed', isActive: false }),
      store({ id: 'nocoord', location: { coordinates: null, address: null, fullAddress: null } }),
    ];
    expect(visibleStores(list, 'all').map((s) => s.id)).toEqual(['ok']);
  });

  it("카테고리 'all'은 모든 카테고리를 통과시킨다", () => {
    const list = [store({ id: 'f', category: 'food' }), store({ id: 'c', category: 'cafe' })];
    expect(visibleStores(list, 'all').map((s) => s.id)).toEqual(['f', 'c']);
    expect(visibleStores(list, 'cafe').map((s) => s.id)).toEqual(['c']);
  });

  it('단과대 필터는 그 단과대의 유효한 제휴가 있는 매장만 남긴다', () => {
    const list = [
      store({ id: 'eng', partnerships: [partnership({ collegeId: '3' })] }),
      store({ id: 'design', partnerships: [partnership({ collegeId: '5' })] }),
      // 단과대는 맞지만 제휴 기간이 끝난 매장
      store({ id: 'expired', partnerships: [partnership({ collegeId: '3', period: { isActive: false } })] }),
    ];
    expect(visibleStores(list, 'all', '3').map((s) => s.id)).toEqual(['eng']);
  });
});

describe('activePartnerships', () => {
  it('기간이 끝난 제휴는 제외한다', () => {
    const s = store({
      partnerships: [
        partnership({ collegeId: '3' }),
        partnership({ collegeId: '5', period: { isActive: false } }),
      ],
    });
    expect(activePartnerships(s).map((p) => p.collegeId)).toEqual(['3']);
  });

  it('같은 단과대가 여러 번 들어와도 하나로 합친다', () => {
    const s = store({
      partnerships: [
        partnership({ collegeId: '3', benefit: '10% 할인' }),
        partnership({ collegeId: '3', benefit: '음료 서비스' }),
      ],
    });
    expect(activePartnerships(s)).toHaveLength(1);
  });
});

describe('searchStores', () => {
  const stores = [store({ id: 'a', name: '북경반점' }), store({ id: 'b', name: '더 치킨', isActive: false })];

  it('띄어쓰기를 무시하고 부분 일치로 찾는다', () => {
    expect(searchStores(stores, '더치킨').map((s) => s.id)).toEqual(['b']);
  });

  it('폐업 매장도 검색 결과에 포함한다 ("이 가게 제휴 되나?"의 답이므로)', () => {
    expect(searchStores(stores, '치킨').map((s) => s.id)).toEqual(['b']);
  });

  it('빈 검색어는 아무것도 반환하지 않는다', () => {
    expect(searchStores(stores, '  ')).toEqual([]);
  });
});

describe('groupByCategory', () => {
  it('결과가 없는 카테고리는 그룹에서 뺀다', () => {
    const groups = groupByCategory([store({ category: 'food' }), store({ category: 'cafe' })]);
    expect(groups.map((g) => g.category)).toEqual(['food', 'cafe']);
  });
});
