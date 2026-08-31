// 훅(ViewModel): 학사 및 셔틀/시설 통합 운영 상태 조회 (TanStack Query 기반)
// 셔틀탭(useShuttle)의 기간/dayType/운행여부 판정에 씀 — Supabase app_config(현재기간·공휴일·강제주말·미운행 오버라이드)를
// 대체하기 위해 나온 API라, 재시작 없이도 관리자 변경사항이 비교적 빨리 반영되도록 staleTime을 짧게 잡았다
import { useQuery } from '@tanstack/react-query';
import { queryClient } from '../../lib/queryClient.js';
import { getAcademicStatusUseCase } from '../../di.js';

const ACADEMIC_STATUS_STALE_TIME = 5 * 60 * 1000;
const academicStatusQueryKey = (date?: string) => ['academic-status', date ?? 'today'];

export function prefetchAcademicStatus() {
  return queryClient.prefetchQuery({
    queryKey: academicStatusQueryKey(),
    queryFn: () => getAcademicStatusUseCase.execute(),
    staleTime: ACADEMIC_STATUS_STALE_TIME,
  });
}

// date를 생략하면(undefined) 백엔드가 한국 시간 기준 오늘로 처리 — 날짜별로 캐시가 분리되도록 queryKey에 포함
export function useAcademicStatus(date?: string) {
  return useQuery({
    queryKey: academicStatusQueryKey(date),
    queryFn: () => getAcademicStatusUseCase.execute({ date }),
    staleTime: ACADEMIC_STATUS_STALE_TIME,
  });
}
