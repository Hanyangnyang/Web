// 도메인 엔티티: 일반버스 정류소 상수 및 도착정보 정렬/병합 순수 함수
import { getDistanceKm } from '../utils/haversine.js';

export interface Coords {
  latitude: number;
  longitude: number;
}

export interface BusArrival {
  busId: string;
  runIndex: number;
  apiMinutes: number;
  info: string;
  direction: string;
}

export interface TickingBusArrival extends Omit<BusArrival, 'apiMinutes'> {
  seconds: number;
  lastApiMinutes: number;
}

export const DEFAULT_PRIORITY = [
  '셔틀콕',
  '기숙사',
  '융합교육관',
  '상록수역',
  '강남역우리은행',
  '의왕톨게이트',
];

export const STOP_COORDS: Record<string, { lat: number; lon: number }> = {
  '셔틀콕': { lat: 37.2989333, lon: 126.83775 },
  '기숙사': { lat: 37.2939833, lon: 126.83535 },
  '융합교육관': { lat: 37.2952667, lon: 126.8384667 },
  '상록수역': { lat: 37.3018167, lon: 126.8652167 },
  '강남역우리은행': { lat: 37.49575, lon: 127.02835 },
  '의왕톨게이트': { lat: 37.3485167, lon: 126.9845 },
};

export const STATION_IDS: Record<string, string> = {
  '셔틀콕': '216000379',
  '기숙사': '216000383',
  '융합교육관': '216000381',
  '상록수역': '216000145',
  '강남역우리은행': '121000974',
  '의왕톨게이트': '226000038',
};

export const ALLOWED_BUSES_BY_STOP: Record<string, string[]> = {
  '셔틀콕': ['3102', '10-1'],
  '기숙사': ['3102', '10-1'],
  '융합교육관': ['3102', '10-1'],
  '상록수역': ['3102', '3100', '3101', '10-1'],
  '강남역우리은행': ['3102', '3100', '3101'],
  '의왕톨게이트': ['3102', '3100', '8147'],
};

export const DEFAULT_DIRECTIONS: Record<string, Record<string, string>> = {
  '3102': {
    '셔틀콕': '강남역 방면',
    '기숙사': '강남역 방면',
    '융합교육관': '강남역 방면',
    '상록수역': '에리카 방면',
    '강남역우리은행': '에리카 방면',
    '의왕톨게이트': '에리카 방면',
  },
  '10-1': {
    '셔틀콕': '상록수역 방면',
    '기숙사': '상록수역 방면',
    '융합교육관': '상록수역 방면',
    '상록수역': '에리카 방면',
  },
  '3100': {
    '상록수역': '에리카 방면',
    '의왕톨게이트': '에리카 방면',
    '강남역우리은행': '에리카 방면',
  },
  '3101': {
    '상록수역': '에리카 방면',
    '강남역우리은행': '에리카 방면',
  },
  '8147': {
    '의왕톨게이트': '상록수역 방면',
  },
};

// 좌표 기준 정류소까지 거리 문자열 ('320m' | '1.4km')
export function getDistanceStrToStop(coords: Coords | null, stopName: string): string | null {
  if (!coords) return null;
  const coord = STOP_COORDS[stopName];
  if (!coord) return null;

  const dist = getDistanceKm(coords.latitude, coords.longitude, coord.lat, coord.lon);
  return dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`;
}

// 좌표 기준 가장 가까운 정류소 이름 (우선순위 목록 내에서만 탐색)
export function getClosestStopName(coords: Coords | null, priorityStops: string[] = DEFAULT_PRIORITY): string | null {
  if (!coords) return null;
  let minDistance = Infinity;
  let closestStop: string | null = null;

  priorityStops.forEach(stopName => {
    const coord = STOP_COORDS[stopName];
    if (!coord) return;
    const dist = getDistanceKm(coords.latitude, coords.longitude, coord.lat, coord.lon);
    if (dist < minDistance) {
      minDistance = dist;
      closestStop = stopName;
    }
  });

  return closestStop;
}

// 즐겨찾기 → 활성 여부 → 거리 순으로 정류소 정렬
export function sortStopsByPriority(
  coords: Coords | null,
  favorites: string[],
  priorityStops: string[] = DEFAULT_PRIORITY,
  activeStops: string[] = DEFAULT_PRIORITY,
): string[] {
  const getStopScore = (stopName: string) => {
    const isFav = favorites.includes(stopName);
    const isActive = activeStops.includes(stopName);

    let dist: number;
    if (coords && STOP_COORDS[stopName]) {
      dist = getDistanceKm(coords.latitude, coords.longitude, STOP_COORDS[stopName].lat, STOP_COORDS[stopName].lon);
    } else {
      dist = priorityStops.indexOf(stopName);
    }

    return { isFav, isActive, dist };
  };

  return [...priorityStops].sort((a, b) => {
    const scoreA = getStopScore(a);
    const scoreB = getStopScore(b);

    if (scoreA.isFav !== scoreB.isFav) return scoreA.isFav ? -1 : 1;
    if (scoreA.isActive !== scoreB.isActive) return scoreA.isActive ? -1 : 1;
    return scoreA.dist - scoreB.dist;
  });
}

// 새로 받아온 정규화 도착정보를 이전 프레임과 병합해 카운트다운(seconds)을 이어간다.
// (API가 예측 '분' 단위만 주기 때문에, 같은 분 값이 유지되는 동안은 초 단위를 직접 흘려보내야 자연스럽다)
export function mergeArrivals(newArrivals: BusArrival[], prevArrivals: TickingBusArrival[] = []): TickingBusArrival[] {
  return newArrivals.map(item => {
    const key = `${item.busId}_${item.runIndex}`;
    const prevMatch = prevArrivals.find(p => `${p.busId}_${p.runIndex}` === key);

    const seconds = (prevMatch && prevMatch.lastApiMinutes === item.apiMinutes)
      ? prevMatch.seconds
      : item.apiMinutes * 60 + 50;

    const { apiMinutes, ...rest } = item;
    return { ...rest, seconds, lastApiMinutes: apiMinutes };
  });
}

// 1초 카운트다운. 변경이 없으면(모두 0) 이전 참조를 그대로 반환해 불필요한 리렌더를 막는다.
export function tickArrivals(arrivals: TickingBusArrival[]): TickingBusArrival[] {
  let changed = false;
  const next = arrivals.map(item => {
    if (item.seconds > 0) {
      changed = true;
      return { ...item, seconds: item.seconds - 1 };
    }
    return item;
  });
  return changed ? next : arrivals;
}
