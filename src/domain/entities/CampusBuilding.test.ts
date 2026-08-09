import { describe, it, expect } from 'vitest';
import { hasCoords, visibleBuildings, hasOpenSpace, openSpaceBuildings, searchBuildings, type CampusBuilding } from './CampusBuilding.js';

// 테스트마다 필요한 필드만 덮어쓰기 위한 최소 건물
function building(overrides: Partial<CampusBuilding> = {}): CampusBuilding {
  return {
    id: 'building-301',
    buildingNumber: '301',
    name: '제1공학관',
    englishName: '',
    aliases: [],
    campus: 'ANSAN',
    coordinates: { latitude: 37.2976, longitude: 126.8374 },
    description: '',
    primaryColleges: [],
    openSpaces: [],
    facilities: [],
    imageUrl: [],
    ...overrides,
  };
}

describe('hasCoords / visibleBuildings', () => {
  // 지오코딩에 실패한 건물은 0,0으로 남겨두기로 했다 (착공중·카카오맵 미등록 등)
  it('좌표가 0,0이면 지도에 표시할 수 없는 건물로 본다', () => {
    expect(hasCoords(building({ coordinates: { latitude: 0, longitude: 0 } }))).toBe(false);
    expect(hasCoords(building())).toBe(true);
  });

  it('위도·경도 중 하나만 0이어도 유효한 좌표로 인정한다', () => {
    expect(hasCoords(building({ coordinates: { latitude: 0, longitude: 126.8 } }))).toBe(true);
  });

  it('visibleBuildings는 좌표 미확보 건물을 걸러낸다', () => {
    const list = [
      building({ id: 'a' }),
      building({ id: 'b', coordinates: { latitude: 0, longitude: 0 } }),
    ];
    expect(visibleBuildings(list).map((b) => b.id)).toEqual(['a']);
  });
});

describe('hasOpenSpace / openSpaceBuildings', () => {
  it('openSpaces가 비어있지 않은 건물만 오픈스페이스로 본다', () => {
    expect(hasOpenSpace(building())).toBe(false);
    expect(hasOpenSpace(building({ openSpaces: ['1층 오픈스페이스'] }))).toBe(true);
  });

  it('openSpaceBuildings는 오픈스페이스가 있는 건물만 남긴다', () => {
    const list = [
      building({ id: 'a', openSpaces: ['1층 오픈스페이스'] }),
      building({ id: 'b' }),
    ];
    expect(openSpaceBuildings(list).map((b) => b.id)).toEqual(['a']);
  });
});

describe('searchBuildings', () => {
  const buildings = [
    building({ id: '301', buildingNumber: '301', name: '제1공학관', aliases: ['1공', '공학1관'] }),
    building({ id: '205', buildingNumber: '205', name: '제1과학기술관', aliases: ['1과기', '과기1관'] }),
    building({ id: '306', buildingNumber: '306', name: '셔틀콕' }),
  ];

  it('정식 명칭의 일부만 쳐도 찾는다 (앞부분이 빠져도)', () => {
    // '제'를 빼고 '1공학'만 쳐도 제1공학관이 나와야 한다
    expect(searchBuildings(buildings, '1공학').map((b) => b.id)).toEqual(['301']);
  });

  it('정식 명칭에 없는 줄임말은 aliases가 받아준다', () => {
    // '과기'는 '제1과학기술관' 어디에도 연속으로 등장하지 않는다
    expect(searchBuildings(buildings, '과기').map((b) => b.id)).toEqual(['205']);
  });

  it('띄어쓰기와 대소문자를 무시한다', () => {
    expect(searchBuildings(buildings, ' 셔 틀 콕 ').map((b) => b.id)).toEqual(['306']);
  });

  it('빈 검색어는 아무것도 반환하지 않는다 (전체 목록이 쏟아지지 않게)', () => {
    expect(searchBuildings(buildings, '')).toEqual([]);
    expect(searchBuildings(buildings, '   ')).toEqual([]);
  });

  it('동번호로도 찾는다 (강의실 표기를 보고 검색하는 경우)', () => {
    expect(searchBuildings(buildings, '301').map((b) => b.id)).toEqual(['301']);
  });

  it('동번호는 부분 일치도 허용한다 (산단 건물 C01 등 영문 접두사 포함)', () => {
    const withCluster = [...buildings, building({ id: 'c01', buildingNumber: 'C01', name: '경기테크노파크' })];
    expect(searchBuildings(withCluster, 'c0').map((b) => b.id)).toEqual(['c01']);
  });

  it('좌표가 없는 건물은 검색 결과에서도 제외한다', () => {
    const withGhost = [...buildings, building({ id: 'ghost', name: '셔틀콕별관', coordinates: { latitude: 0, longitude: 0 } })];
    expect(searchBuildings(withGhost, '셔틀콕').map((b) => b.id)).toEqual(['306']);
  });
});
