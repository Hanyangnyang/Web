// 도메인 엔티티: ERICA캠퍼스 주차장
// 실제 데이터는 ./parkingLots.json에서 관리 — 아직 UI/기능 검증 단계라 클린아키텍처의 데이터 레이어
// (datasource/repository)는 두지 않고, 동아리 데이터(Club.ts)처럼 정적 import로 바로 쓴다.
// 백엔드 API가 생기면 그때 데이터 레이어를 추가해 이 파일의 static import만 교체하면 된다.
import parkingLotsData from './parkingLots.json';
import type { Coordinates } from './Coordinates.js';

export interface ParkingLot {
  id: string;
  name: string;
  campus: string;
  coordinates: Coordinates | null;
  // 총 주차 가능 대수 — 구역이 나뉘어 있어 대수를 확정할 수 없는 경우 null
  capacity: number | null;
  address: string;
  description: string | null;
  imageUrl: string[];
}

export const PARKING_LOTS: ParkingLot[] = parkingLotsData as ParkingLot[];

export type PlottableParkingLot = ParkingLot & { coordinates: Coordinates };

function hasCoords(lot: ParkingLot): lot is PlottableParkingLot {
  return lot.coordinates !== null;
}

// 좌표가 있는 주차장만 반환
export function visibleParkingLots(lots: ParkingLot[]): PlottableParkingLot[] {
  return lots.filter(hasCoords);
}
