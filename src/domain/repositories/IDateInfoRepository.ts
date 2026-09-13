// 도메인 레포지토리 인터페이스: 특정 날짜의 평일/주말/공휴일/미운행 상태 조회 계약 (구현은 data 레이어의 DateInfoRepository)
import type { DateInfo } from '../entities/DateInfo.js';

export interface GetDateInfoParams {
  // YYYY-MM-DD. 생략하면 백엔드가 한국 시간 기준 오늘로 처리
  date?: string;
}

export interface DateInfoRepository {
  getDateInfo: (params?: GetDateInfoParams) => Promise<DateInfo>;
}
