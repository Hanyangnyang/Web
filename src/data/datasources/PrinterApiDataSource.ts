// 데이터 소스: 캠퍼스맵 프린터 새 백엔드(/api/v1/campus-map/printers*) 원시 호출 — 로그인·Authorization 헤더 없음
import { parseOrThrow, type ApiResponse, type HttpClient } from '../../infrastructure/http/HttpClient.js';

export interface PrinterDto {
  id: string;
  buildingId: string;
  buildingName?: string | null;
  campus: string;
  detailLocation: string;
  name: string | null;
  price: string | null;
  paymentMethod: string | null;
  notes: string | null;
  broken: boolean;
  removed: boolean;
  updatedAt: string | null;
  version: number;
}

// Spring Page 응답 중 쓰는 필드만
export interface PrinterPageDto {
  content: PrinterDto[];
  number: number;
  totalPages: number;
  totalElements: number;
  last?: boolean;
}

// 신규 제보·수정 제보에 공통으로 쓰는 프린터 필드.
// 값이 undefined인 키는 JSON.stringify가 빼므로 '모르면 생략' 규칙이 그대로 지켜진다
export interface PrinterFieldsDto {
  buildingId?: string;
  detailLocation?: string;
  name?: string | null;
  price?: string | null;
  paymentMethod?: string | null;
  notes?: string | null;
  broken?: boolean;
  removed?: boolean;
}

export interface NewPrinterReportDto {
  reporterDeviceId: string;
  printer: PrinterFieldsDto & { buildingId: string; detailLocation: string };
  description?: string;
}

export interface PrinterChangeReportDto {
  reporterDeviceId: string;
  expectedVersion: number;
  changes: PrinterFieldsDto;
  description?: string;
}

export interface PrinterReportResultDto {
  reportId: string;
  status: string; // 접수 직후엔 'PENDING' — 관리자 승인 후 반영
}

export interface PrinterListParams {
  campus?: string;
  buildingId?: string;
  page?: number;
  size?: number;
}

export interface PrinterApiDataSource {
  getPrinters: (params?: PrinterListParams) => Promise<ApiResponse<PrinterPageDto>>;
  getPrinter: (id: string) => Promise<ApiResponse<PrinterDto>>;
  postNewPrinterReport: (body: NewPrinterReportDto) => Promise<ApiResponse<PrinterReportResultDto>>;
  postPrinterReport: (id: string, body: PrinterChangeReportDto) => Promise<ApiResponse<PrinterReportResultDto>>;
}

export const createPrinterApiDataSource = ({ httpClient }: { httpClient: HttpClient }): PrinterApiDataSource => ({
  getPrinters: async (params = {}) => {
    // 필터를 고르지 않았으면 파라미터 자체를 생략한다 (빈 문자열로 보내지 않기 — API 문서 요구사항)
    const query = new URLSearchParams();
    if (params.campus) query.set('campus', params.campus);
    if (params.buildingId) query.set('buildingId', params.buildingId);
    if (params.page != null) query.set('page', String(params.page));
    if (params.size != null) query.set('size', String(params.size));
    const qs = query.toString();
    return parseOrThrow(await httpClient.get(`/api/v1/campus-map/printers${qs ? `?${qs}` : ''}`));
  },

  getPrinter: async (id) =>
    parseOrThrow(await httpClient.get(`/api/v1/campus-map/printers/${encodeURIComponent(id)}`)),

  postNewPrinterReport: async (body) =>
    parseOrThrow(await httpClient.post('/api/v1/campus-map/printer-reports', body)),

  postPrinterReport: async (id, body) =>
    parseOrThrow(await httpClient.post(`/api/v1/campus-map/printers/${encodeURIComponent(id)}/reports`, body)),
});
