import { describe, expect, it, vi } from 'vitest';
import { createPrinterRepository, toPrinter } from './PrinterRepository.js';
import { PrinterReportError } from '../../domain/repositories/IPrinterRepository.js';
import type { PrinterApiDataSource, PrinterDto, PrinterPageDto } from '../datasources/PrinterApiDataSource.js';
import type { HttpError } from '../../infrastructure/http/HttpClient.js';

// API 문서의 목록 응답 예시 그대로
function dto(overrides: Partial<PrinterDto> = {}): PrinterDto {
  return {
    id: 'd29546b0-9f49-4a47-b7ce-030aa5e87b43',
    buildingId: 'building-101',
    buildingName: '학술정보관',
    campus: 'ANSAN',
    detailLocation: '1층 로비 편의점 옆',
    name: '로비 프린터',
    price: 'A4 흑백 100원, 컬러 500원 / A3 흑백 200원',
    paymentMethod: '카드, 현금',
    notes: '주말 이용 가능',
    broken: false,
    removed: false,
    updatedAt: '2026-11-06T06:00:00Z',
    version: 3,
    ...overrides,
  };
}

function page(content: PrinterDto[], number: number, totalPages: number): PrinterPageDto {
  return { content, number, totalPages, totalElements: content.length };
}

function httpError(status: number | undefined, message: string, code?: string): HttpError {
  const err = new Error(message) as HttpError;
  if (status !== undefined) err.statusCode = status;
  if (code) err.code = code;
  return err;
}

function fakeDataSource(overrides: Partial<PrinterApiDataSource> = {}): PrinterApiDataSource {
  return {
    getPrinters: vi.fn(async () => ({ success: true, data: page([dto()], 0, 1) })),
    getPrinter: vi.fn(async () => ({ success: true, data: dto() })),
    postNewPrinterReport: vi.fn(async () => ({ success: true, data: { reportId: 'r-1', status: 'PENDING' } })),
    postPrinterReport: vi.fn(async () => ({ success: true, data: { reportId: 'r-2', status: 'PENDING' } })),
    ...overrides,
  };
}

describe('toPrinter', () => {
  it('문서 예시 응답을 그대로 엔티티로 옮긴다', () => {
    expect(toPrinter(dto())).toEqual({
      id: 'd29546b0-9f49-4a47-b7ce-030aa5e87b43',
      buildingId: 'building-101',
      buildingName: '학술정보관',
      campus: 'ANSAN',
      detailLocation: '1층 로비 편의점 옆',
      name: '로비 프린터',
      price: 'A4 흑백 100원, 컬러 500원 / A3 흑백 200원',
      paymentMethod: '카드, 현금',
      notes: '주말 이용 가능',
      broken: false,
      removed: false,
      updatedAt: '2026-11-06T06:00:00Z',
      version: 3,
    });
  });

  it('nullable 필드(name·price·paymentMethod·notes)는 null로, 빈 문자열도 null로', () => {
    const p = toPrinter(dto({ name: null, price: '', paymentMethod: '  ', notes: null }));
    expect(p).toMatchObject({ name: null, price: null, paymentMethod: null, notes: null });
  });

  it('필수값(id·buildingId·detailLocation·version)이 없으면 그 프린터만 건너뛴다', () => {
    expect(toPrinter(dto({ id: '' }))).toBeNull();
    expect(toPrinter(dto({ buildingId: undefined as unknown as string }))).toBeNull();
    expect(toPrinter(dto({ detailLocation: '' }))).toBeNull();
    expect(toPrinter(dto({ version: undefined as unknown as number }))).toBeNull();
  });

  it('broken·removed가 boolean이 아니면 "등록된 상태 없음"(false)으로 본다', () => {
    const p = toPrinter(dto({ broken: 'yes' as unknown as boolean, removed: null as unknown as boolean }));
    expect(p).toMatchObject({ broken: false, removed: false });
  });
});

describe('getPrinters', () => {
  it('페이지를 끝까지 모아 한 배열로 돌려준다 (size 100으로 요청)', async () => {
    const getPrinters = vi.fn()
      .mockResolvedValueOnce({ success: true, data: page([dto({ id: 'a' })], 0, 2) })
      .mockResolvedValueOnce({ success: true, data: page([dto({ id: 'b' })], 1, 2) });
    const repo = createPrinterRepository({ printerApiDataSource: fakeDataSource({ getPrinters }) });

    const result = await repo.getPrinters({ campus: 'ANSAN' });

    expect(result.map((p) => p.id)).toEqual(['a', 'b']);
    expect(getPrinters).toHaveBeenNthCalledWith(1, { campus: 'ANSAN', page: 0, size: 100 });
    expect(getPrinters).toHaveBeenNthCalledWith(2, { campus: 'ANSAN', page: 1, size: 100 });
  });

  it('빈 목록이면 빈 배열 (지금 운영 서버 상태)', async () => {
    const getPrinters = vi.fn(async () => ({ success: true, data: page([], 0, 0) }));
    const repo = createPrinterRepository({ printerApiDataSource: fakeDataSource({ getPrinters }) });
    expect(await repo.getPrinters()).toEqual([]);
    expect(getPrinters).toHaveBeenCalledTimes(1);
  });

  it('형식이 이상한 프린터 하나 때문에 목록 전체가 실패하지 않는다', async () => {
    const getPrinters = vi.fn(async () => ({ success: true, data: page([dto({ id: 'ok' }), dto({ id: '' })], 0, 1) }));
    const repo = createPrinterRepository({ printerApiDataSource: fakeDataSource({ getPrinters }) });
    expect((await repo.getPrinters()).map((p) => p.id)).toEqual(['ok']);
  });

  it('success:false면 에러', async () => {
    const getPrinters = vi.fn(async () => ({ success: false, data: null as unknown as PrinterPageDto, error: { code: 'X', message: '실패' } }));
    const repo = createPrinterRepository({ printerApiDataSource: fakeDataSource({ getPrinters }) });
    await expect(repo.getPrinters()).rejects.toThrow('실패');
  });
});

describe('getPrinter', () => {
  it('철거된 프린터도 removed:true로 돌려준다', async () => {
    const getPrinter = vi.fn(async () => ({ success: true, data: dto({ removed: true }) }));
    const repo = createPrinterRepository({ printerApiDataSource: fakeDataSource({ getPrinter }) });
    expect(await repo.getPrinter('x')).toMatchObject({ removed: true });
  });

  it('404(삭제·없음)는 에러가 아니라 null', async () => {
    const getPrinter = vi.fn(async () => { throw httpError(404, '없음'); });
    const repo = createPrinterRepository({ printerApiDataSource: fakeDataSource({ getPrinter }) });
    expect(await repo.getPrinter('x')).toBeNull();
  });

  it('404가 아닌 실패는 그대로 던진다', async () => {
    const getPrinter = vi.fn(async () => { throw httpError(500, '서버 오류'); });
    const repo = createPrinterRepository({ printerApiDataSource: fakeDataSource({ getPrinter }) });
    await expect(repo.getPrinter('x')).rejects.toThrow('서버 오류');
  });
});

describe('제보', () => {
  it('신규 제보: 받은 그대로 보내고 접수 결과(PENDING)를 돌려준다', async () => {
    const ds = fakeDataSource();
    const repo = createPrinterRepository({ printerApiDataSource: ds });
    const report = {
      reporterDeviceId: 'a8370474-b60c-4fa5-941c-57324cd3020b',
      printer: { buildingId: 'building-101', detailLocation: '1층 로비 편의점 옆', price: 'A4 흑백 100원, 컬러 500원' },
      description: '오늘 이용한 프린터입니다.',
    };

    expect(await repo.submitNewPrinterReport(report)).toEqual({ reportId: 'r-1', status: 'PENDING' });
    expect(ds.postNewPrinterReport).toHaveBeenCalledWith(report);
  });

  it('수정 제보: printerId는 경로로, 나머지는 본문으로 보낸다', async () => {
    const ds = fakeDataSource();
    const repo = createPrinterRepository({ printerApiDataSource: ds });

    await repo.submitPrinterReport({
      printerId: 'p-1',
      reporterDeviceId: 'dev',
      expectedVersion: 3,
      changes: { price: 'A4 흑백 200원', broken: true },
    });

    expect(ds.postPrinterReport).toHaveBeenCalledWith('p-1', {
      reporterDeviceId: 'dev',
      expectedVersion: 3,
      changes: { price: 'A4 흑백 200원', broken: true },
    });
  });

  it.each([
    [400, 'invalid'],
    [404, 'notFound'],
    [409, 'conflict'],
    [500, 'server'],
    [503, 'server'],
  ] as const)('HTTP %i → %s', async (status, kind) => {
    const postPrinterReport = vi.fn(async () => { throw httpError(status, `HTTP ${status}`); });
    const repo = createPrinterRepository({ printerApiDataSource: fakeDataSource({ postPrinterReport }) });

    const err = await repo.submitPrinterReport({ printerId: 'p', reporterDeviceId: 'd', expectedVersion: 1, changes: { broken: true } })
      .catch((e: unknown) => e);

    expect(err).toBeInstanceOf(PrinterReportError);
    expect((err as PrinterReportError).kind).toBe(kind);
  });

  it('409: 서버가 준 메시지와 코드를 그대로 전달한다', async () => {
    const postPrinterReport = vi.fn(async () => { throw httpError(409, '프린터 정보가 변경되었습니다. 최신 정보를 확인해주세요.', 'PT001'); });
    const repo = createPrinterRepository({ printerApiDataSource: fakeDataSource({ postPrinterReport }) });

    const err = (await repo.submitPrinterReport({ printerId: 'p', reporterDeviceId: 'd', expectedVersion: 1, changes: {} })
      .catch((e: unknown) => e)) as PrinterReportError;

    expect(err).toMatchObject({ kind: 'conflict', code: 'PT001', message: '프린터 정보가 변경되었습니다. 최신 정보를 확인해주세요.' });
  });

  it('응답을 못 받으면(네트워크·타임아웃) network', async () => {
    const postNewPrinterReport = vi.fn(async () => { throw new TypeError('Failed to fetch'); });
    const repo = createPrinterRepository({ printerApiDataSource: fakeDataSource({ postNewPrinterReport }) });

    const err = (await repo.submitNewPrinterReport({ reporterDeviceId: 'd', printer: { buildingId: 'b', detailLocation: 'l' } })
      .catch((e: unknown) => e)) as PrinterReportError;

    expect(err.kind).toBe('network');
    expect(err.message).toBe('네트워크 연결을 확인하고 다시 시도해주세요.');
  });
});
