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
function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dy = (lat1 - lat2) * 111_000;
  const dx = (lng1 - lng2) * 88_000;
  return Math.hypot(dx, dy);
}

// 이 레벨 이하(최대 확대)에서는 클러스터링하지 않고 전부 개별 마커로 보여준다
const NO_CLUSTER_LEVEL = 1;

// 같은 건물(동일 좌표) 매장들을 겹치지 않게 부채꼴로 펼치는 반경(m)
// 최대 확대(0.25m/px)에서 마커(32px≈8m)끼리 떨어져 보이는 최소 거리
const FAN_OUT_RADIUS_M = 10;

/** 동일/근접 좌표 매장들을 작은 원형으로 펼쳐 개별 클러스터로 반환 */
function fanOutOverlapping(stores: PartnerStore[]): StoreCluster[] {
  const byCoord = new Map<string, PartnerStore[]>();
  for (const store of stores) {
    const { latitude, longitude } = store.location;
    if (latitude == null || longitude == null) continue;
    const key = `${latitude.toFixed(5)},${longitude.toFixed(5)}`; // ≈1m 단위로 동일 좌표 판정
    byCoord.set(key, [...(byCoord.get(key) ?? []), store]);
  }

  const result: StoreCluster[] = [];
  for (const group of byCoord.values()) {
    if (group.length === 1) {
      const s = group[0];
      result.push({ lat: s.location.latitude as number, lng: s.location.longitude as number, stores: [s] });
      continue;
    }
    // 원 둘레에 균등 배치 (매장 수가 많으면 반경을 키워 겹침 방지)
    const radius = FAN_OUT_RADIUS_M * Math.max(1, group.length / 4);
    group.forEach((s, i) => {
      const angle = (2 * Math.PI * i) / group.length;
      result.push({
        lat: (s.location.latitude as number) + (radius * Math.cos(angle)) / 111_000,
        lng: (s.location.longitude as number) + (radius * Math.sin(angle)) / 88_000,
        stores: [s],
      });
    });
  }
  return result;
}

export function clusterStores(stores: PartnerStore[], level: number): StoreCluster[] {
  // 최대 확대: 전부 개별 표시 (동일 좌표 매장은 부채꼴로 펼침)
  if (level <= NO_CLUSTER_LEVEL) return fanOutOverlapping(stores);

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
