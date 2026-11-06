// 도메인 레포지토리 인터페이스: 캠퍼스 프린터 조회·제보 (구현은 data 레이어의 PrinterRepository)
import type { Printer } from '../entities/Printer.js';

// 제보로 보낼 수 있는 프린터 필드. 키를 아예 안 넣으면(undefined) '변경 없음/모름'이라 서버로 안 간다.
//  - name·price·paymentMethod·notes: null을 넣으면 '기존 정보 지우기' 요청
//  - buildingId·detailLocation·broken·removed: null 불가 (타입으로 막는다)
//  - broken·removed: 모를 땐 false로 채우지 말고 키를 빼야 한다 ('미확인'과 '아니오'는 다르다)
export interface PrinterFields {
  buildingId?: string;
  detailLocation?: string;
  name?: string | null;
  price?: string | null;
  paymentMethod?: string | null;
  notes?: string | null;
  broken?: boolean;
  removed?: boolean;
}

export interface NewPrinterReport {
  reporterDeviceId: string;
  printer: PrinterFields & { buildingId: string; detailLocation: string }; // 이 둘은 필수
  description?: string;
}

export interface PrinterChangeReport {
  printerId: string;
  reporterDeviceId: string;
  expectedVersion: number;  // 사용자가 보고 고친 프린터 정보의 version
  changes: PrinterFields;   // 바꿀 항목만
  description?: string;
}

export interface PrinterReportResult {
  reportId: string;
  status: string; // 'PENDING' — 관리자 승인 후 반영되므로, 접수 직후 화면의 공개 정보를 바꾸면 안 된다
}

// 제보 실패를 화면이 '무엇을 해야 하는지' 기준으로 나눈 종류
//  - invalid  (400): 입력값 문제 (변경 내용이 없는 수정 제보 포함)
//  - notFound (404): 프린터·건물이 없음 → 목록 갱신·안내
//  - conflict (409): 그새 프린터 정보가 바뀜 → 최신 정보를 다시 보여주고 사용자가 재확인 후 다시 제출 (자동 재전송 금지)
//  - server   (5xx 등 그 밖): 서버 오류 → 재시도 안내
//  - network       : 응답 자체를 못 받음(오프라인·타임아웃) → 재시도 안내
export type PrinterReportErrorKind = 'invalid' | 'notFound' | 'conflict' | 'server' | 'network';

export class PrinterReportError extends Error {
  readonly kind: PrinterReportErrorKind;
  readonly code?: string;     // 서버 에러 코드 (예: 'PT001')

  constructor(kind: PrinterReportErrorKind, message: string, code?: string) {
    super(message);
    this.name = 'PrinterReportError';
    this.kind = kind;
    this.code = code;
  }
}

export interface PrinterListFilter {
  campus?: string;
  buildingId?: string;
}

export interface PrinterRepository {
  // 목록 — 서버 페이지를 끝까지 모아 한 배열로 돌려준다 (철거·삭제된 프린터는 서버가 이미 뺀다)
  getPrinters: (filter?: PrinterListFilter) => Promise<Printer[]>;
  // 상세 — 철거된 프린터도 removed:true로 온다. 삭제됐거나 없으면 null
  getPrinter: (id: string) => Promise<Printer | null>;
  submitNewPrinterReport: (report: NewPrinterReport) => Promise<PrinterReportResult>;
  submitPrinterReport: (report: PrinterChangeReport) => Promise<PrinterReportResult>;
}
