// 훅(ViewModel): 캠퍼스(ERICA) 프린터 목록 조회 — GET /api/v1/campus-map/printers
import { useQuery } from '@tanstack/react-query';
import { getPrintersUseCase } from '../../../di.js';
import type { Printer } from '../../../domain/entities/Printer.js';

// 제보는 관리자 승인 후 반영돼서 실시간일 필요는 없다. 다만 고장 여부는 하루 안에도 바뀌므로
// 하루짜리 정적 데이터(createStaticDataQuery)보다 짧게 둔다
const PRINTER_STALE_TIME = 10 * 60 * 1000;

// 수정 제보가 409·404로 실패하면 최신 목록을 다시 받아야 해서 키를 밖에서도 쓴다
export const PRINTERS_QUERY_KEY = ['campus', 'printers', 'ANSAN'] as const;

export interface UsePrintersResult {
  printers: Printer[];
  loading: boolean;
  loadErr: string | null;
}

export function usePrinters({ enabled = true }: { enabled?: boolean } = {}): UsePrintersResult {
  const { data, isLoading, isError } = useQuery({
    queryKey: PRINTERS_QUERY_KEY,
    queryFn: () => getPrintersUseCase.execute({ campus: 'ANSAN' }),
    staleTime: PRINTER_STALE_TIME,
    enabled,
  });

  return {
    printers: data ?? [],
    loading: isLoading,
    loadErr: isError ? '프린터 정보를 불러오지 못했어요' : null,
  };
}
