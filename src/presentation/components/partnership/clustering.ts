// 줌 레벨 기반 마커 클러스터링 (그리디 방식)
// 화면상 일정 픽셀 반경 안에 모이는 매장들을 하나의 원으로 묶는다.
// 레벨이 낮아질수록(확대) 임계 거리가 줄어 자연스럽게 개별 마커로 분리된다.
import type { PartnerStore } from './storeData';

export interface StoreCluster {
  lat: number;
  lng: number;
  stores: PartnerStore[];
}

// 클러스터로 묶이는 화면상 반경(px)
const CLUSTER_RADIUS_PX = 52;

// 카카오맵 레벨별 축척: level 3 ≈ 1m/px, 레벨 1 증가마다 2배
function metersPerPixel(level: number): number {
  return 2 ** (level - 3);
}

// 캠퍼스 반경 수준의 근거리라 평면 근사로 충분 (위도 1도≈111km, 경도는 위도 37° 기준 ≈88km)
export function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dy = (lat1 - lat2) * 111_000;
  const dx = (lng1 - lng2) * 88_000;
  return Math.hypot(dx, dy);
}

// 이 레벨 이하(최대 확대)에서는 클러스터링하지 않고 전부 개별 마커로 보여준다
const NO_CLUSTER_LEVEL = 1;

// 마커 원의 화면상 최대 지름(선택 시 40px) + 최소 여백 — 이보다 가까우면 겹친 것으로 보고 밀어낸다.
// 정확히 동일한 좌표든 몇 미터 떨어진 다른 좌표든, 화면 거리 기준이라 두 경우 모두 처리된다.
const MIN_SEPARATION_PX = 44;
const RESOLVE_ITERATIONS = 8;

/**
 * 화면 픽셀 거리 기준으로 겹치는 마커들을 서로 밀어낸다 (물리 시뮬레이션 없는 단순 반발 이완법).
 * 위경도를 캠퍼스 인근에서만 유효한 평면 좌표(m)로 변환해 계산한 뒤 다시 위경도로 되돌린다.
 */
function resolveOverlaps(stores: PartnerStore[], level: number): StoreCluster[] {
  const withCoords = stores.filter(
    (s): s is PartnerStore & { location: { latitude: number; longitude: number } } =>
      s.location.latitude != null && s.location.longitude != null
  );
  if (withCoords.length === 0) return [];

  const originLat = withCoords[0].location.latitude;
  const originLng = withCoords[0].location.longitude;
  const points = withCoords.map((s) => ({
    store: s,
    x: (s.location.longitude - originLng) * 88_000,
    y: (s.location.latitude - originLat) * 111_000,
  }));

  const minSepM = MIN_SEPARATION_PX * metersPerPixel(level);

  for (let iter = 0; iter < RESOLVE_ITERATIONS; iter++) {
    let moved = false;
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const dx = points[j].x - points[i].x;
        const dy = points[j].y - points[i].y;
        const dist = Math.hypot(dx, dy);
        if (dist >= minSepM) continue;
        moved = true;
        // 완전히 겹쳐 거리가 0이면 인덱스 기반 고정 각도로 방향을 정해 결정적으로 밀어낸다
        const angle = dist > 0.01 ? Math.atan2(dy, dx) : (2 * Math.PI * (i + j)) / points.length;
        const push = (minSepM - dist) / 2;
        points[i].x -= Math.cos(angle) * push;
        points[i].y -= Math.sin(angle) * push;
        points[j].x += Math.cos(angle) * push;
        points[j].y += Math.sin(angle) * push;
      }
    }
    if (!moved) break;
  }

  return points.map((p) => ({
    lat: originLat + p.y / 111_000,
    lng: originLng + p.x / 88_000,
    stores: [p.store],
  }));
}

export function clusterStores(stores: PartnerStore[], level: number): StoreCluster[] {
  // 최대 확대: 전부 개별 표시, 겹치는 마커는 화면 거리 기준으로 서로 밀어낸다
  if (level <= NO_CLUSTER_LEVEL) return resolveOverlaps(stores, level);

  const threshold = CLUSTER_RADIUS_PX * metersPerPixel(level);
  const clusters: StoreCluster[] = [];

  for (const store of stores) {
    const { latitude, longitude } = store.location;
    if (latitude == null || longitude == null) continue;

    const nearby = clusters.find(
      (c) => distanceMeters(c.lat, c.lng, latitude, longitude) < threshold
    );
    if (nearby) {
      nearby.stores.push(store);
      // 중심을 소속 매장들의 평균 좌표로 갱신
      nearby.lat = nearby.stores.reduce((sum, s) => sum + (s.location.latitude ?? 0), 0) / nearby.stores.length;
      nearby.lng = nearby.stores.reduce((sum, s) => sum + (s.location.longitude ?? 0), 0) / nearby.stores.length;
    } else {
      clusters.push({ lat: latitude, lng: longitude, stores: [store] });
    }
  }
  return clusters;
}
