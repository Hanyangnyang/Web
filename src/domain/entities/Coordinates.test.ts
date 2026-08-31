import { describe, it, expect } from 'vitest';
import { normalizeCoordinates } from './Coordinates.js';

// 이 함수는 데이터 레이어의 경계다 — 손으로 관리하는 JSON이 '좌표 미확보'를 제각각 적어 두는 것을
// 여기서 전부 null로 흡수해, 도메인부터는 '없음 = null' 하나만 알면 되게 한다.
describe('normalizeCoordinates', () => {
  it('정상 좌표는 그대로 통과시킨다', () => {
    expect(normalizeCoordinates({ latitude: 37.2976, longitude: 126.8374 }))
      .toEqual({ latitude: 37.2976, longitude: 126.8374 });
  });

  // ERICA는 위도 37.29~37.30 / 경도 126.83 언저리라 어느 쪽도 0이 될 수 없다.
  // 이 캠퍼스 좌표계에서 0은 값이 아니라 '아직 못 채운 칸'이다.
  it('{0,0}은 좌표 미확보로 보고 null로 만든다', () => {
    expect(normalizeCoordinates({ latitude: 0, longitude: 0 })).toBeNull();
  });

  it('한쪽만 0이어도 지도에 찍을 수 없으므로 null로 만든다', () => {
    expect(normalizeCoordinates({ latitude: 0, longitude: 126.8 })).toBeNull();
    expect(normalizeCoordinates({ latitude: 37.2976, longitude: 0 })).toBeNull();
  });

  // partnerships.json은 좌표가 없으면 둘 다 null로 적는다 (실제 3건)
  it('위경도가 null이면 null', () => {
    expect(normalizeCoordinates({ latitude: null, longitude: null })).toBeNull();
  });

  // 위도만 있는 좌표는 지도에 찍을 수 없다 — 반쪽짜리를 도메인에 들이지 않는다
  it('한쪽만 채워진 반쪽짜리도 null', () => {
    expect(normalizeCoordinates({ latitude: 37.2976, longitude: null })).toBeNull();
    expect(normalizeCoordinates({ longitude: 126.8374 })).toBeNull();
  });

  // 폐업 매장은 location이 통째로 없다
  it('null·undefined·빈 객체는 null', () => {
    expect(normalizeCoordinates(null)).toBeNull();
    expect(normalizeCoordinates(undefined)).toBeNull();
    expect(normalizeCoordinates({})).toBeNull();
  });
});
