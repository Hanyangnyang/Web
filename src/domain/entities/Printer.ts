// 도메인 엔티티: 캠퍼스 프린터 — 백엔드 /api/v1/campus-map/printers 응답(교내시설 하위 리소스)에 맞춘 모양.
// 응답 검증·변환은 data 레이어의 PrinterRepository가 하고, 여기는 화면이 쓰는 모양과 순수 함수만 둔다.
import type { Coordinates } from './Coordinates.js';

export interface Printer {
  id: string;                    // 서버 UUID
  // 이 프린터가 있는 교내시설(CampusBuilding.id) — 지도 좌표·교내시설 상세의 프린터 목록이 이 값으로 건물과 연결된다
  buildingId: string;
  buildingName: string | null;   // 서버가 같이 내려주는 건물 이름 (예: '학술정보관')
  campus: string;                // 'ANSAN' | 'SEOUL'
  detailLocation: string;        // 건물 안 위치 (예: '1층 로비 편의점 옆') — 서버 필수값
  name: string | null;           // 없을 수 있다 → 화면 표시는 printerDisplayName으로
  // 가격은 자유 문구 — 'A4 흑백 100원, 컬러 500원 / A3 흑백 200원' 형식도, 그 밖의 옛 자유 형식도 섞여 있어 그대로 보여준다
  price: string | null;
  paymentMethod: string | null;  // 자유 문구 (예: '카드, 현금')
  notes: string | null;          // 참고사항 (예: '주말 이용 가능')
  // 고장으로 '등록된' 상태인지. false는 '고장 등록 없음'일 뿐 '정상 작동 확인'이 아니다 — 그렇게 표시하지 말 것
  broken: boolean;
  removed: boolean;              // 철거됨 — 목록엔 안 오고, 상세 조회로만 올 수 있다
  updatedAt: string | null;      // ISO 8601 (예: '2026-11-06T06:00:00Z')
  // 수정 제보의 expectedVersion으로 그대로 보낸다 — 사용자가 '이 버전을 보고' 고쳤다는 표시(서버가 충돌을 409로 알려준다)
  version: number;
}

// 건물 안에서의 이름 — 세부위치(detailLocation, 예: '2층 휴게실').
// 이미 건물 안이라는 걸 아는 자리(교내시설 상세의 '이 건물 프린터' 목록)에서 쓴다.
// name 필드는 쓰지 않는다 — 화면 이름은 항상 '건물 + 세부위치'로 통일하기로 했다
export function printerShortName(printer: Pick<Printer, 'detailLocation'>): string {
  return printer.detailLocation;
}

// 화면 제목용 이름 — 건물 이름 + 세부위치 (예: '학술정보관 2층 휴게실').
// 세부위치만으로는 어느 건물인지 알 수 없어서 붙인다. 세부위치가 이미 건물 이름으로 시작하면 두 번 붙이지 않는다
export function printerDisplayName(printer: Pick<Printer, 'detailLocation' | 'buildingName'>): string {
  const short = printerShortName(printer);
  const building = printer.buildingName?.trim();
  if (!building || short.startsWith(building)) return short;
  return `${building} ${short}`;
}

// ── 지도 표시용 ──
// API 응답엔 좌표가 없다(프린터는 건물 하위 리소스). 지도에 찍으려면 건물 좌표를 붙인 PlottablePrinter가 필요하다.
export type PlottablePrinter = Printer & { coordinates: Coordinates };

// 프린터마다 소속 건물(buildingId)의 좌표를 붙인다. 좌표를 모르는 건물(목록에 없거나 좌표 미확보)의 프린터는
// 지도·거리순 목록에 둘 수 없어 뺀다 — 교내시설 상세의 프린터 목록은 좌표가 필요 없어 원본 목록을 따로 쓴다
export function toPlottablePrinters(
  printers: Printer[],
  buildings: readonly { id: string; coordinates: Coordinates | null }[]
): PlottablePrinter[] {
  const coordsById = new Map(buildings.map((b) => [b.id, b.coordinates]));
  return printers.flatMap((p) => {
    const coordinates = coordsById.get(p.buildingId);
    return coordinates ? [{ ...p, coordinates }] : [];
  });
}

// 한 교내시설 안의 프린터 목록 (교내시설 상세 시트용)
export function printersInBuilding<T extends Printer>(printers: T[], buildingId: string): T[] {
  return printers.filter((p) => p.buildingId === buildingId);
}
