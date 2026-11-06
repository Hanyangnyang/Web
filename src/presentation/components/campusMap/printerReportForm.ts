// 프린터 제보 폼의 순수 로직 — 폼 값 ↔ API 요청 변환 (화면은 PrinterFeedbackModal).
// API 문서 규칙을 한곳에 모아 테스트한다:
//  - 신규 제보: buildingId·detailLocation 필수, 나머지는 아는 것만 (빈 칸은 키 생략)
//  - 수정 제보: 바꾼 항목만 changes에. 지운 칸은 null(name·price·paymentMethod·notes만 허용)
//  - 고장 여부: '모름'은 보내지 않는다. 실제로 상태가 바뀌는 경우에만 true/false
//  - 가격: 흑백/컬러 숫자 → '흑백 100원, 컬러 500원' 문자열
import type { Printer } from '../../../domain/entities/Printer.js';
import type { PrinterFields } from '../../../domain/repositories/IPrinterRepository.js';

// 'unknown' = 모름(서버로 안 보냄), 'yes'/'no' = 사용자가 직접 확인한 값
export type TriState = 'unknown' | 'yes' | 'no';

export interface PrinterReportForm {
  building: string;
  // 자동완성 후보에서 고른 교내시설 id — 신규 제보 API의 필수값이라, 목록에서 골라야만 채워진다.
  // 직접 친 이름(목록에 없는 건물)이면 null → 제보할 수 없다
  buildingId: string | null;
  detailLocation: string;
  priceMono: string;   // 흑백 1장 가격 (숫자만)
  priceColor: string;  // 컬러 1장 가격 (숫자만)
  payment: string;
  note: string;
  broken: TriState;    // 수정 제보에서만 입력받는다
}

export const EMPTY_FORM: PrinterReportForm = {
  building: '', buildingId: null, detailLocation: '', priceMono: '', priceColor: '', payment: '', note: '',
  broken: 'unknown',
};

// 서버 가격 문자열에서 흑백/컬러 숫자만 뽑아 칸에 채운다 (자유 형식이라 못 뽑으면 빈 칸)
function parsePrice(price: string | null, tag: '흑백' | '컬러'): string {
  const m = price?.match(new RegExp(`${tag}\\s*([\\d,]+)\\s*원`));
  return m ? m[1].replace(/,/g, '') : '';
}

export function composePrice(f: Pick<PrinterReportForm, 'priceMono' | 'priceColor'>): string {
  return [f.priceMono && `흑백 ${f.priceMono}원`, f.priceColor && `컬러 ${f.priceColor}원`].filter(Boolean).join(', ');
}

// 수정 제보의 시작 값 — 지금 서버 정보로 칸을 채운다
export function formFromPrinter(p: Printer): PrinterReportForm {
  return {
    ...EMPTY_FORM,
    detailLocation: p.detailLocation,
    priceMono: parsePrice(p.price, '흑백'),
    priceColor: parsePrice(p.price, '컬러'),
    payment: p.paymentMethod ?? '',
    note: p.notes ?? '',
    // 고장 등록이 없으면(false) '정상'이 골라진 채로 시작한다 — 사용자가 '고장'으로만 바꾸면 되게.
    // '정상'을 그대로 두면 서버 값과 같아 buildChanges가 broken을 보내지 않는다
    broken: p.broken ? 'yes' : 'no',
  };
}

// 필수 칸(*) — 신규는 건물(목록에서 고른 것)·세부위치, 수정은 세부위치
export function hasRequired(f: PrinterReportForm, isEdit: boolean): boolean {
  return f.detailLocation.trim() !== '' && (isEdit || f.buildingId !== null);
}

// 신규 제보 printer 본문 — 빈 칸은 undefined라 JSON에서 키가 빠진다 (broken·removed는 아예 안 보낸다)
export function buildNewPrinter(f: PrinterReportForm): PrinterFields & { buildingId: string; detailLocation: string } {
  if (!f.buildingId) throw new Error('buildingId is required for a new printer report');
  return {
    buildingId: f.buildingId,
    detailLocation: f.detailLocation.trim(),
    price: composePrice(f) || undefined,
    paymentMethod: f.payment.trim() || undefined,
    notes: f.note.trim() || undefined,
  };
}

// 수정 제보 changes — '시작 값(base)'과 달라진 칸만 넣는다.
//  printer: base를 만든 서버 정보 (고장 여부를 '실제로 바뀌는지'로 판단하려고 필요)
export function buildChanges(f: PrinterReportForm, base: PrinterReportForm, printer: Printer): PrinterFields {
  const changes: PrinterFields = {};

  const detail = f.detailLocation.trim();
  if (detail !== base.detailLocation.trim() && detail) changes.detailLocation = detail; // null 불가 — 빈 값이면 필수 검사에서 막힌다

  const price = composePrice(f);
  if (price !== composePrice(base)) changes.price = price || null;

  const payment = f.payment.trim();
  if (payment !== base.payment.trim()) changes.paymentMethod = payment || null;

  const note = f.note.trim();
  if (note !== base.note.trim()) changes.notes = note || null;

  // 고장: 등록 안 된 프린터를 '고장'으로 → true, 고장 등록된 프린터를 '정상'으로 → false (고장 해제 요청).
  // 이미 같은 상태이거나 '모름'이면 안 보낸다 — 변경 없는 요청은 서버가 400으로 거절한다
  if (f.broken === 'yes' && !printer.broken) changes.broken = true;
  if (f.broken === 'no' && printer.broken) changes.broken = false;

  return changes;
}

// 409 뒤 최신 정보로 다시 맞출 때 — 사용자가 손대지 않은 칸은 최신 값으로 바꾸고, 고친 칸은 그대로 둔다
// (자동 재전송 금지: 합친 결과를 보여주고 사용자가 다시 제출하게 한다)
const MERGE_KEYS = ['detailLocation', 'priceMono', 'priceColor', 'payment', 'note', 'broken'] as const;

export function mergeWithLatest(
  f: PrinterReportForm, oldBase: PrinterReportForm, newBase: PrinterReportForm
): PrinterReportForm {
  const merged = { ...f };
  for (const k of MERGE_KEYS) {
    if (f[k] === oldBase[k]) (merged as Record<string, unknown>)[k] = newBase[k];
  }
  return merged;
}

// 두 시작 값 사이에 서버 쪽에서 무엇이 바뀌었는지 — 409 안내 문구에 쓴다
const DIFF_LABELS: { label: string; show: (f: PrinterReportForm) => string }[] = [
  { label: '세부위치', show: (f) => f.detailLocation.trim() },
  { label: '가격', show: composePrice },
  { label: '결제방식', show: (f) => f.payment.trim() },
  { label: '참고사항', show: (f) => f.note.trim() },
  { label: '고장 여부', show: (f) => f.broken },
];

export function changedLabels(a: PrinterReportForm, b: PrinterReportForm): string[] {
  return DIFF_LABELS.filter((d) => d.show(a) !== d.show(b)).map((d) => d.label);
}
