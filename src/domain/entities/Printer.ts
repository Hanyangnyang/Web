// 도메인 엔티티: 캠퍼스 프린터 — 백엔드 /api/v1/campus-map/printers 응답(교내시설 하위 리소스)에 맞춘 모양.
// 응답 검증·변환은 data 레이어의 PrinterRepository가 하고, 여기는 화면이 쓰는 모양과 순수 함수만 둔다.
import printersData from './printers.json';
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

// 화면 제목용 이름 — 이름이 없으면 세부위치로 대신한다 (서버 정렬 규칙도 이름이 없으면 세부위치를 쓴다)
export function printerDisplayName(printer: Pick<Printer, 'name' | 'detailLocation'>): string {
  return printer.name?.trim() || printer.detailLocation;
}

// ── 지도 표시용 ──
// API 응답엔 좌표가 없다(프린터는 건물 하위 리소스). 지도에 찍으려면 건물 좌표를 붙인 PlottablePrinter가 필요하다.
export type PlottablePrinter = Printer & { coordinates: Coordinates };

// TODO(2단계): API 연결 전까지 화면이 쓰는 예시 데이터. 좌표는 아직 JSON에 직접 들어 있다
export const PRINTERS: PlottablePrinter[] = printersData as PlottablePrinter[];

// 한 교내시설 안의 프린터 목록 (교내시설 상세 시트용)
export function printersInBuilding<T extends Printer>(printers: T[], buildingId: string): T[] {
  return printers.filter((p) => p.buildingId === buildingId);
}
