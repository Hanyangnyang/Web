// 도메인 엔티티: ERICA캠퍼스 프린터
// 실제 데이터는 ./printers.json에서 관리 — 아직 위치 목록을 모으는 중이라(지금은 예시 1곳뿐) 주차장(ParkingLot.ts)처럼
// 데이터 레이어 없이 정적 import로 바로 쓴다. 백엔드 API가 생기면 그때 이 파일의 static import만 교체하면 된다.
import printersData from './printers.json';
import type { Coordinates } from './Coordinates.js';

export interface Printer {
  id: string;
  name: string;
  campus: string;
  coordinates: Coordinates | null;
  // 건물 안 위치 (예: '1층 로비') — 같은 건물에 여러 대가 있을 수 있어 이름과 따로 둔다
  location: string | null;
  description: string | null;
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
