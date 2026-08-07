// 지도에 찍을 매장 좌표 목록.
// 마커는 선택 여부와 무관하게 항상 실좌표 그대로 찍힌다(선택된 것만 핀, 나머지는 점 — markerZoom.ts)
// 여러 매장이 동시에 핀으로 겹쳐 보일 일이 없으므로, 위치를 밀어내는 겹침 방지 로직은 필요 없다.
import type { PartnerStore } from '../../../domain/entities/PartnerStore.js';

export interface PlottedStore {
  lat: number;
  lng: number;
  store: PartnerStore;
}

export function layoutStores(stores: PartnerStore[]): PlottedStore[] {
  return stores
    .filter(
      (s): s is PartnerStore & { location: { latitude: number; longitude: number } } =>
        s.location.latitude != null && s.location.longitude != null
    )
    .map((s) => ({ lat: s.location.latitude, lng: s.location.longitude, store: s }));
}
