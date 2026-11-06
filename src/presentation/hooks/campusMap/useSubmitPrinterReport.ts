// 훅(ViewModel): 캠퍼스 프린터 제보 — 신규 프린터(POST /printer-reports) / 기존 프린터 수정·고장(POST /printers/{id}/reports).
// 제보는 관리자 승인 후 반영되므로 성공해도 화면의 공개 정보(목록 캐시)는 건드리지 않는다.
// 단, 409(그새 정보 변경)·404(프린터 삭제)는 지금 화면 정보가 낡았다는 뜻이라 목록을 다시 받아온다.
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usePostHog } from 'posthog-js/react';
import {
  getPrinterUseCase, submitNewPrinterReportUseCase, submitPrinterChangeReportUseCase,
} from '../../../di.js';
import { getOrCreateAnonymousUserId } from '../../../lib/supabase.js';
import {
  PrinterReportError,
  type PrinterFields,
} from '../../../domain/repositories/IPrinterRepository.js';
import type { Printer } from '../../../domain/entities/Printer.js';
import { PRINTERS_QUERY_KEY } from './usePrinters.js';

export interface NewPrinterInput {
  printer: PrinterFields & { buildingId: string; detailLocation: string };
  description?: string;
}

export interface PrinterChangeInput {
  printerId: string;
  expectedVersion: number;
  changes: PrinterFields;
  description?: string;
}

// 409·404면 목록이 낡은 것 — 다시 받아오게 표시한다
function useInvalidateOnStale() {
  const queryClient = useQueryClient();
  return (error: unknown) => {
    if (error instanceof PrinterReportError && (error.kind === 'conflict' || error.kind === 'notFound')) {
      void queryClient.invalidateQueries({ queryKey: PRINTERS_QUERY_KEY });
    }
  };
}

export function useSubmitNewPrinterReport() {
  const posthog = usePostHog();
  const invalidateOnStale = useInvalidateOnStale();
  return useMutation({
    mutationKey: ['campus', 'printer-report', 'new'],
    mutationFn: async ({ printer, description }: NewPrinterInput) => {
      // 기존 기기 UUID 재사용 (플레이리스트 신고·알림 구독과 같은 익명 사용자 id)
      const reporterDeviceId = await getOrCreateAnonymousUserId();
      return submitNewPrinterReportUseCase.execute({ reporterDeviceId, printer, description });
    },
    onSuccess: () => posthog?.capture('partner_map_printer_report_submitted', { type: 'new' }),
    onError: invalidateOnStale,
  });
}

export function useSubmitPrinterChangeReport() {
  const posthog = usePostHog();
  const invalidateOnStale = useInvalidateOnStale();
  return useMutation({
    mutationKey: ['campus', 'printer-report', 'change'],
    mutationFn: async ({ printerId, expectedVersion, changes, description }: PrinterChangeInput) => {
      const reporterDeviceId = await getOrCreateAnonymousUserId();
      return submitPrinterChangeReportUseCase.execute({ printerId, reporterDeviceId, expectedVersion, changes, description });
    },
    // 어떤 항목을 고쳤는지만 남긴다 (값 자체는 자유 입력이라 싣지 않는다)
    onSuccess: (_, { printerId, changes }) =>
      posthog?.capture('partner_map_printer_report_submitted', { type: 'edit', printer_id: printerId, fields: Object.keys(changes) }),
    onError: invalidateOnStale,
  });
}

// 409 뒤 최신 정보를 다시 보여줄 때 쓰는 단건 조회 — 삭제됐으면 null, 철거됐으면 removed:true
export function fetchLatestPrinter(id: string): Promise<Printer | null> {
  return getPrinterUseCase.execute(id);
}
