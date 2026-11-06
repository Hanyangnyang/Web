// 유스케이스: 캠퍼스 프린터 제보 — 신규 프린터 제보 / 기존 프린터 정보 수정·고장·철거 제보.
// 둘 다 관리자 승인 후 반영되는 '제안'이라 접수(PENDING)만 돌려준다
import type {
  NewPrinterReport, PrinterChangeReport, PrinterReportResult, PrinterRepository,
} from '../repositories/IPrinterRepository.js';

export interface SubmitNewPrinterReportUseCase {
  execute: (report: NewPrinterReport) => Promise<PrinterReportResult>;
}

export interface SubmitPrinterChangeReportUseCase {
  execute: (report: PrinterChangeReport) => Promise<PrinterReportResult>;
}

export const createSubmitNewPrinterReportUseCase = (
  { printerRepository }: { printerRepository: PrinterRepository }
): SubmitNewPrinterReportUseCase => ({
  execute: (report) => printerRepository.submitNewPrinterReport(report),
});

export const createSubmitPrinterChangeReportUseCase = (
  { printerRepository }: { printerRepository: PrinterRepository }
): SubmitPrinterChangeReportUseCase => ({
  execute: (report) => printerRepository.submitPrinterReport(report),
});
