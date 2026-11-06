// 유스케이스: 캠퍼스 프린터 상세 조회 — 철거된 프린터도 removed:true로 오고, 삭제·없음이면 null
import type { Printer } from '../entities/Printer.js';
import type { PrinterRepository } from '../repositories/IPrinterRepository.js';

export interface GetPrinterUseCase {
  execute: (id: string) => Promise<Printer | null>;
}

export const createGetPrinterUseCase = (
  { printerRepository }: { printerRepository: PrinterRepository }
): GetPrinterUseCase => ({
  execute: (id) => printerRepository.getPrinter(id),
});
