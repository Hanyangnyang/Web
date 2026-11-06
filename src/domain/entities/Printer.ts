// 도메인 엔티티: ERICA캠퍼스 프린터
// 실제 데이터는 ./printers.json에서 관리 — 아직 위치 목록을 모으는 중이라 주차장(ParkingLot.ts)처럼
// 데이터 레이어 없이 정적 import로 바로 쓴다. 백엔드 API가 생기면 그때 이 파일의 static import만 교체하면 된다.
// 필드 구성은 백엔드에서 내려줄 응답 필드(이름·세부위치·가격·결제방식·참고사항·고장여부·최근수정일)에 맞춘다.
import printersData from './printers.json';
import type { Coordinates } from './Coordinates.js';

export interface Printer {
  id: string;
  // 목록·상세 시트 제목에 그대로 쓰는 이름 (예: '1공 한자공 프린터기')
  name: string;
  campus: string;
  // 이 프린터가 있는 교내시설(CampusBuilding.id) — 백엔드에서 프린터는 교내시설 하위에 붙는다(오픈스페이스와 같은 구조).
  // 교내시설 상세 시트가 이 값으로 '이 건물의 프린터' 목록을 만든다. 건물 밖(야외 등)이면 null
  buildingId: string | null;
  coordinates: Coordinates | null;
  // 어느 건물 몇 층 어디에 있는지 (예: '제1공학관 2층 한자공 앞')
  detailLocation: string | null;
  // 가격 — 흑백/컬러/양면 등 조합이 프린터마다 달라 자유 문구로 받는다 (예: '흑백 50원 · 컬러 200원')
  price: string | null;
  // 결제방식 — 카드·계정·현금 등 조합이 프린터마다 달라 자유 문구 하나로 받는다 (예: '카드, 프린터 계정 필요')
  paymentMethod: string | null;
  // 사용자에게 공지해야 할 내용 (예: '최근 고장이 잦다는 제보가 있어요')
  notice: string | null;
  // 고장 여부 — null은 '확인 안 됨'. 모르는 걸 '정상'으로 보여주지 않으려고 boolean과 구분한다
  isBroken: boolean | null;
  // 이 프린터 정보가 마지막으로 갱신된 날짜 (ISO 8601, 예: '2026-11-03')
  updatedAt: string | null;
}

export const PRINTERS: Printer[] = printersData as Printer[];

export type PlottablePrinter = Printer & { coordinates: Coordinates };

function hasCoords(printer: Printer): printer is PlottablePrinter {
  return printer.coordinates !== null;
}

// 좌표가 있는 프린터만 반환
export function visiblePrinters(printers: Printer[]): PlottablePrinter[] {
  return printers.filter(hasCoords);
}

// 한 교내시설 안의 프린터 목록 (교내시설 상세 시트용)
export function printersInBuilding<T extends Printer>(printers: T[], buildingId: string): T[] {
  return printers.filter((p) => p.buildingId === buildingId);
}
