// 레포지토리: 캠퍼스 프린터 API 응답(DTO) ↔ 도메인 엔티티 변환, 목록 페이지 모으기, 제보 실패를 의미별 에러로 변환
import { apiError, withAreaTag, type HttpError } from '../../infrastructure/http/HttpClient.js';
import type { Printer } from '../../domain/entities/Printer.js';
import {
  PrinterReportError,
  type PrinterRepository, type PrinterReportErrorKind, type PrinterReportResult,
} from '../../domain/repositories/IPrinterRepository.js';
import type { PrinterApiDataSource, PrinterDto, PrinterReportResultDto } from '../datasources/PrinterApiDataSource.js';
import type { ApiResponse } from '../../infrastructure/http/HttpClient.js';

// Sentry 태그용 — 다른 /api/v1/* 레포지토리와 같은 apiError 패턴
const AREA = '프린터';

// 목록은 서버 최대 page size(100)로 끝까지 모은다. 캠퍼스 프린터가 수천 대일 리 없어 상한은 안전장치일 뿐
const PAGE_SIZE = 100;
const MAX_PAGES = 20;

const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v : null);

// id·건물·세부위치·version 중 하나라도 믿을 수 없으면 그 프린터만 건너뛴다 —
// 건물 없이는 지도에 못 찍고, version 없이는 수정 제보를 못 보내서 화면에 둬도 쓸 수 없다
export function toPrinter(raw: PrinterDto): Printer | null {
  const id = str(raw?.id);
  const buildingId = str(raw?.buildingId);
  const detailLocation = str(raw?.detailLocation);
  if (!id || !buildingId || !detailLocation) return null;
  if (typeof raw.version !== 'number' || !Number.isFinite(raw.version)) return null;

  return {
    id,
    buildingId,
    buildingName: str(raw.buildingName),
    campus: str(raw.campus) ?? 'ANSAN',
    detailLocation,
    name: str(raw.name),
    price: str(raw.price),
    paymentMethod: str(raw.paymentMethod),
    notes: str(raw.notes),
    // boolean이 아니면 '등록된 상태 없음'으로 본다 — 고장·철거를 근거 없이 단정하지 않기 위해
    broken: raw.broken === true,
    removed: raw.removed === true,
    updatedAt: str(raw.updatedAt),
    version: raw.version,
  };
}

function toPrinters(list: PrinterDto[]): Printer[] {
  return list
    .map((raw) => {
      // 예상 못 한 예외에도 프린터 하나 때문에 목록 전체가 안 뜨지 않게 (PartnerStoreRepository와 같은 안전망)
      try {
        return toPrinter(raw);
      } catch (e) {
        console.warn('[PrinterRepository] 프린터 매핑 실패, 건너뜀', raw, e);
        return null;
      }
    })
    .filter((p): p is Printer => p !== null);
}

// HTTP 상태 → 화면이 할 일 기준의 에러 종류 (API 문서의 오류 처리 표)
function kindOf(status: number | undefined): PrinterReportErrorKind {
  if (status === undefined) return 'network';
  if (status === 400) return 'invalid';
  if (status === 404) return 'notFound';
  if (status === 409) return 'conflict';
  return 'server';
}

const DEFAULT_MESSAGE: Record<PrinterReportErrorKind, string> = {
  invalid: '입력한 내용을 다시 확인해주세요.',
  notFound: '프린터 또는 건물 정보를 찾을 수 없어요.',
  conflict: '프린터 정보가 변경되었습니다. 최신 정보를 확인해주세요.',
  server: '서버에 문제가 생겼어요. 잠시 후 다시 시도해주세요.',
  network: '네트워크 연결을 확인하고 다시 시도해주세요.',
};

// 제보 요청을 감싸 실패를 PrinterReportError로 바꾼다. 서버가 준 메시지가 있으면 그대로 쓴다
async function submit(call: () => Promise<ApiResponse<PrinterReportResultDto>>): Promise<PrinterReportResult> {
  let res: ApiResponse<PrinterReportResultDto>;
  try {
    res = await call();
  } catch (e) {
    const err = e as HttpError;
    const kind = kindOf(err?.statusCode);
    // 서버 메시지가 없을 때 parseOrThrow가 만드는 'HTTP 409' 같은 문구는 사용자에게 보여줄 말이 아니라 기본 문구로 바꾼다
    const serverMessage = err?.statusCode !== undefined && err.message && !/^HTTP \d+$/.test(err.message) ? err.message : null;
    // Sentry 태그(area·endpoint)는 다른 레포지토리의 apiError와 같은 이름으로 붙인다 — 도메인 에러 타입엔 넣지 않는다
    throw Object.assign(new PrinterReportError(kind, serverMessage ?? DEFAULT_MESSAGE[kind], err?.code), {
      area: AREA,
      endpoint: err?.endpoint,
    });
  }
  if (!res.success || !res.data || typeof res.data.reportId !== 'string') {
    throw Object.assign(new PrinterReportError('server', res.error?.message || DEFAULT_MESSAGE.server, res.error?.code), {
      area: AREA,
      endpoint: res._requestUrl,
    });
  }
  return { reportId: res.data.reportId, status: res.data.status ?? 'PENDING' };
}

export const createPrinterRepository = ({ printerApiDataSource }: { printerApiDataSource: PrinterApiDataSource }): PrinterRepository => ({
  getPrinters: (filter = {}) => withAreaTag(AREA, async () => {
    const all: Printer[] = [];
    for (let page = 0; page < MAX_PAGES; page++) {
      const res = await printerApiDataSource.getPrinters({ ...filter, page, size: PAGE_SIZE });
      if (!res.success)
        throw apiError(res.error?.message || 'printers API returned success:false', { area: AREA, endpoint: res._requestUrl });
      if (!res.data || !Array.isArray(res.data.content))
        throw apiError('printers API returned invalid shape', { area: AREA, endpoint: res._requestUrl });

      all.push(...toPrinters(res.data.content));
      // 마지막 페이지면 끝. last가 없으면 totalPages로 판단
      const isLast = res.data.last ?? (page + 1 >= (res.data.totalPages ?? 0));
      if (isLast || res.data.content.length === 0) break;
    }
    return all;
  }),

  getPrinter: (id) => withAreaTag(AREA, async () => {
    let res: ApiResponse<PrinterDto>;
    try {
      res = await printerApiDataSource.getPrinter(id);
    } catch (e) {
      // 삭제됐거나 없는 프린터 — 에러가 아니라 '없음'으로 돌려줘 화면이 안내하게 한다
      if ((e as HttpError)?.statusCode === 404) return null;
      throw e;
    }
    if (!res.success)
      throw apiError(res.error?.message || 'printer detail API returned success:false', { area: AREA, endpoint: res._requestUrl });
    const printer = res.data ? toPrinter(res.data) : null;
    if (!printer) throw apiError('printer detail API returned invalid shape', { area: AREA, endpoint: res._requestUrl });
    return printer;
  }),

  submitNewPrinterReport: (report) =>
    submit(() => printerApiDataSource.postNewPrinterReport(report)),

  submitPrinterReport: ({ printerId, ...body }) =>
    submit(() => printerApiDataSource.postPrinterReport(printerId, body)),
});
