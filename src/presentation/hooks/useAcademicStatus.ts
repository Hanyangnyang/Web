// 훅(ViewModel): 학사 및 셔틀/시설 통합 운영 상태 조회 (TanStack Query 기반) — 실제 화면 연동은 추후 진행
import { useQuery } from '@tanstack/react-query';
import { getAcademicStatusUseCase } from '../../di.js';

// 공휴일/학기 구분 자체는 자주 안 바뀌지만, 셔틀 긴급 미운행(태풍 등) 같은 당일 상태 변경도 함께 담고 있어서
// 정적 일정(예: 셔틀 12시간)보다는 짧게, 날씨(10분)와 비슷한 수준으로 둠
const ACADEMIC_STATUS_STALE_TIME = 10 * 60 * 1000;

// date를 생략하면(undefined) 백엔드가 한국 시간 기준 오늘로 처리 — 날짜별로 캐시가 분리되도록 queryKey에 포함
export function useAcademicStatus(date?: string) {
  return useQuery({
    queryKey: ['academic-status', date ?? 'today'],
    queryFn: () => getAcademicStatusUseCase.execute({ date }),
    staleTime: ACADEMIC_STATUS_STALE_TIME,
  });
}
