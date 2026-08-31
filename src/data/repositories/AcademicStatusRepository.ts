// 레포지토리: 학사 및 셔틀/시설 통합 운영 상태 API 응답을 도메인 엔티티로 변환해 제공
import { apiError } from '../../infrastructure/http/HttpClient.js';
import { createAcademicStatus } from '../../domain/entities/AcademicStatus.js';
import type { AcademicStatusApiDataSource } from '../datasources/AcademicStatusApiDataSource.js';
import type { AcademicStatusRepository } from '../../domain/repositories/IAcademicStatusRepository.js';

const AREA = '학사/셔틀 운영상태'; // Sentry 태그용 — 이 레포지토리가 던지는 모든 검증 에러에 공통으로 붙는 한글 이름표

export const createAcademicStatusRepository = (
  { academicStatusApiDataSource }: { academicStatusApiDataSource: AcademicStatusApiDataSource }
): AcademicStatusRepository => ({
  getStatus: async (params) => {
    const res = await academicStatusApiDataSource.getStatus(params?.date);

    if (!res.success)
      throw apiError(res.error?.message || `academic status API returned 'success:false'`, { area: AREA, endpoint: res._requestUrl });

    if (!res.data || !res.data.calendar || !res.data.academic || !res.data.shuttle)
      throw apiError(`academic status API returned invalid shaped 'data': ${JSON.stringify(res.data)}`, { area: AREA, endpoint: res._requestUrl });

    return createAcademicStatus(res.data);
  },
});
