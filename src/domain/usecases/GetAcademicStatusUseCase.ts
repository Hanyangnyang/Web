// 유스케이스: 학사 및 셔틀/시설 통합 운영 상태 조회
import type { AcademicStatus } from '../entities/AcademicStatus.js';
import type { AcademicStatusRepository, GetAcademicStatusParams } from '../repositories/IAcademicStatusRepository.js';

export interface GetAcademicStatusUseCase {
  execute: (params?: GetAcademicStatusParams) => Promise<AcademicStatus>;
}

export const createGetAcademicStatusUseCase = (
  { academicStatusRepository }: { academicStatusRepository: AcademicStatusRepository }
): GetAcademicStatusUseCase => ({
  execute: (params) => academicStatusRepository.getStatus(params),
});
