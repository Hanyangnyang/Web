// 훅(ViewModel): 특정 날짜의 평일/주말/공휴일/미운행 상태 조회 (TanStack Query 기반) — 실제 화면 연동은 추후 진행
import { useQuery } from '@tanstack/react-query';
import { getDateInfoUseCase } from '../../di.js';

const DATE_INFO_STALE_TIME = 24 * 60 * 60 * 1000; // 24시간 — 평일/주말/공휴일 여부는 하루 안에 안 바뀜

// date를 생략하면(undefined) 백엔드가 한국 시간 기준 오늘로 처리 — 날짜별로 캐시가 분리되도록 queryKey에 포함
export function useDateInfo(date?: string) {
  return useQuery({
    queryKey: ['date-info', date ?? 'today'],
    queryFn: () => getDateInfoUseCase.execute({ date }),
    staleTime: DATE_INFO_STALE_TIME,
  });
}
