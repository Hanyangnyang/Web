// 훅(ViewModel): 특정 날짜의 평일/주말/공휴일/미운행 상태 조회 (TanStack Query 기반)
// 셔틀탭의 지하철 dayType 판정(useShuttle.ts)에 씀 — academic/status.calendar는 학교 자체 공휴일까지
// 섞여 내려와서 지하철엔 못 쓰고, 순수 공공기념일 기준인 이 API를 따로 쓴다
import { useQuery } from '@tanstack/react-query';
import { getDateInfoUseCase } from '../../di.js';

const DATE_INFO_STALE_TIME = 60 * 60 * 1000; // 1시간 — 평일/주말/공휴일 여부는 하루 안에 안 바뀌지만, 다른 API들과 통일해 더 짧게 재검증

// date를 생략하면(undefined) 백엔드가 한국 시간 기준 오늘로 처리 — 날짜별로 캐시가 분리되도록 queryKey에 포함
// enabled: 지하철 연결정보가 필요 없는 상황(정류장·탭 비활성)에서는 조회 자체를 건너뛸 때 씀
export function useDateInfo(date?: string, enabled = true) {
  return useQuery({
    queryKey: ['date-info', date ?? 'today'],
    queryFn: () => getDateInfoUseCase.execute({ date }),
    staleTime: DATE_INFO_STALE_TIME,
    enabled,
  });
}
