// 유스케이스: 캠퍼스 프린터 목록 조회 (캠퍼스·건물 필터 선택)
import type { Printer } from '../entities/Printer.js';
import type { PrinterListFilter, PrinterRepository } from '../repositories/IPrinterRepository.js';

export interface GetPrintersUseCase {
  execute: (filter?: PrinterListFilter) => Promise<Printer[]>;
}

export const createGetPrintersUseCase = (
  { printerRepository }: { printerRepository: PrinterRepository }
): GetPrintersUseCase => ({
  execute: (filter) => printerRepository.getPrinters(filter),
});
