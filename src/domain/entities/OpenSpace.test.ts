import { describe, it, expect } from 'vitest';
import { openSpaceLabel, openSpaceCoordinates, type OpenSpace } from './OpenSpace.js';

function openSpace(overrides: Partial<OpenSpace> = {}): OpenSpace {
  return {
    id: 'openspace-06',
    buildingId: 'building-301',
    floor: '1층',
    name: '해동열람실',
    hint: '정문 들어가서 오른쪽',
    ...overrides,
  };
}

describe('openSpaceLabel', () => {
  it('층과 이름을 붙여 한 줄로 만든다', () => {
    expect(openSpaceLabel(openSpace())).toBe('1층 해동열람실');
  });

  // 학술정보관의 '열람실'처럼 층 표기가 없는 실제 데이터가 있다
  it('층이 없으면 이름만 쓴다 (앞에 빈칸이 생기지 않는다)', () => {
    expect(openSpaceLabel(openSpace({ floor: null, name: '열람실' }))).toBe('열람실');
  });
});

describe('openSpaceCoordinates', () => {
  const buildings = [
    { id: 'building-301', coordinates: { latitude: 37.2976, longitude: 126.8374 } },
    { id: 'building-302', coordinates: { latitude: 37.2980, longitude: 126.8380 } },
  ];

  it('소속 건물의 좌표를 빌려 쓴다', () => {
    expect(openSpaceCoordinates(openSpace(), buildings)).toEqual(buildings[0].coordinates);
  });

  // 건물 목록이 아직 안 왔거나 소속 건물이 지워진 경우 — 지도에 찍지 않는다
  it('소속 건물을 못 찾으면 null', () => {
    expect(openSpaceCoordinates(openSpace({ buildingId: 'building-999' }), buildings)).toBeNull();
  });
});
