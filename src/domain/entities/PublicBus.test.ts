import { describe, it, expect } from 'vitest';
import {
  getDistanceStrToStop,
  getClosestStopName,
  sortStopsByPriority,
  mergeArrivals,
  tickArrivals,
  DEFAULT_PRIORITY,
  ALLOWED_BUSES_BY_STOP,
  DEFAULT_DIRECTIONS,
} from './PublicBus.js';

describe('상록수역 일반버스 설정', () => {
  it('3100번과 3101번을 에리카 방면 노선으로 포함한다', () => {
    expect(ALLOWED_BUSES_BY_STOP['상록수역']).toEqual(['3102', '3100', '3101', '10-1']);
    expect(DEFAULT_DIRECTIONS['3100']['상록수역']).toBe('에리카 방면');
    expect(DEFAULT_DIRECTIONS['3101']['상록수역']).toBe('에리카 방면');
  });
});

describe('getDistanceStrToStop', () => {
  it('좌표가 없으면 null을 반환한다', () => {
    expect(getDistanceStrToStop(null, '셔틀콕')).toBeNull();
  });

  it('모르는 정류소면 null을 반환한다', () => {
    expect(getDistanceStrToStop({ latitude: 37.3, longitude: 126.8 }, '존재안함')).toBeNull();
  });

  it('1km 미만이면 미터 단위로, 이상이면 km 단위(소수 첫째자리)로 표기한다', () => {
    // 정류소 좌표 정확히 그 지점이면 0m
    expect(getDistanceStrToStop({ latitude: 37.2989333, longitude: 126.83775 }, '셔틀콕')).toBe('0m');
    // 캠퍼스에서 멀리 떨어진 좌표는 km 단위
    expect(getDistanceStrToStop({ latitude: 37.5665, longitude: 126.9780 }, '셔틀콕')).toMatch(/^\d+\.\dkm$/);
  });
});

describe('getClosestStopName', () => {
  it('좌표가 없으면 null을 반환한다', () => {
    expect(getClosestStopName(null)).toBeNull();
  });

  it('정류소 좌표 정확히 위에 있으면 그 정류소가 가장 가깝다', () => {
    expect(getClosestStopName({ latitude: 37.3018167, longitude: 126.8652167 })).toBe('상록수역');
  });
});

describe('sortStopsByPriority', () => {
  it('즐겨찾기한 정류소가 항상 맨 앞에 온다 (거리와 무관)', () => {
    const coords = { latitude: 37.49575, longitude: 127.02835 }; // 강남역우리은행 좌표
    const sorted = sortStopsByPriority(coords, ['의왕톨게이트']);
    expect(sorted[0]).toBe('의왕톨게이트');
  });

  it('즐겨찾기가 없으면 좌표 기준 가까운 순으로 정렬한다', () => {
    const coords = { latitude: 37.3018167, longitude: 126.8652167 }; // 상록수역 좌표
    const sorted = sortStopsByPriority(coords, []);
    expect(sorted[0]).toBe('상록수역');
  });

  it('좌표가 없으면 DEFAULT_PRIORITY 원래 순서를 그대로 유지한다', () => {
    expect(sortStopsByPriority(null, [])).toEqual(DEFAULT_PRIORITY);
  });
});

describe('mergeArrivals', () => {
  const rawArrivals = [
    { busId: '3102', runIndex: 0, apiMinutes: 3, info: '2번째전', direction: '강남역 방면' },
  ];

  it('이전 기록이 없으면 apiMinutes*60+50초로 카운트다운을 새로 시작한다', () => {
    const merged = mergeArrivals(rawArrivals, []);
    expect(merged[0].seconds).toBe(3 * 60 + 50);
    expect(merged[0].lastApiMinutes).toBe(3);
  });

  it('API가 알려준 분(minute) 값이 그대로면, 새로고침이 와도 초 단위 카운트다운을 이어간다', () => {
    const prev = [{ busId: '3102', runIndex: 0, seconds: 42, lastApiMinutes: 3, info: '2번째전', direction: '강남역 방면' }];
    const merged = mergeArrivals(rawArrivals, prev);
    expect(merged[0].seconds).toBe(42); // 새로 계산 안 하고 이전 값 유지
  });

  it('API 분 값이 바뀌면 카운트다운을 리셋한다', () => {
    const prev = [{ busId: '3102', runIndex: 0, seconds: 5, lastApiMinutes: 4, info: '', direction: '' }];
    const merged = mergeArrivals(rawArrivals, prev);
    expect(merged[0].seconds).toBe(3 * 60 + 50); // lastApiMinutes(4) !== apiMinutes(3) → 리셋
  });

  it('결과 객체에 원본 API 응답의 apiMinutes 필드를 그대로 남기지 않는다 (lastApiMinutes로만 보존)', () => {
    const merged = mergeArrivals(rawArrivals, []);
    expect(merged[0]).not.toHaveProperty('apiMinutes');
  });
});

describe('tickArrivals', () => {
  it('0보다 큰 seconds를 1씩 줄인다', () => {
    const result = tickArrivals([{ busId: '3102', runIndex: 0, seconds: 5, lastApiMinutes: 0, info: '', direction: '' }]);
    expect(result[0].seconds).toBe(4);
  });

  it('이미 0인 항목은 더 줄이지 않는다', () => {
    const arrivals = [{ busId: '3102', runIndex: 0, seconds: 0, lastApiMinutes: 0, info: '', direction: '' }];
    const result = tickArrivals(arrivals);
    expect(result[0].seconds).toBe(0);
  });

  it('아무 항목도 줄어들지 않았으면 원본 배열 참조를 그대로 반환한다 (불필요한 리렌더 방지)', () => {
    const arrivals = [{ busId: '3102', runIndex: 0, seconds: 0, lastApiMinutes: 0, info: '', direction: '' }];
    expect(tickArrivals(arrivals)).toBe(arrivals);
  });

  it('하나라도 줄어들면 새 배열 참조를 반환한다', () => {
    const arrivals = [{ busId: '3102', runIndex: 0, seconds: 5, lastApiMinutes: 0, info: '', direction: '' }];
    expect(tickArrivals(arrivals)).not.toBe(arrivals);
  });
});
