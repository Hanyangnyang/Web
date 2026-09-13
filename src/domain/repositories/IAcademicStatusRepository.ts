// 도메인 레포지토리 인터페이스: 학사 및 셔틀/시설 통합 운영 상태 조회 계약 (구현은 data 레이어의 AcademicStatusRepository)
import type { AcademicStatus } from '../entities/AcademicStatus.js';

export interface GetAcademicStatusParams {
  // YYYY-MM-DD. 생략하면 백엔드가 한국 시간 기준 오늘로 처리
  date?: string;
}

export interface AcademicStatusRepository {
  getStatus: (params?: GetAcademicStatusParams) => Promise<AcademicStatus>;
}
