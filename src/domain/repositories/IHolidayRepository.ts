// 도메인 레포지토리 인터페이스: 오늘의 법정공휴일 여부 제공 계약 (구현은 data 레이어의 HolidayRepository)
export interface HolidayRepository {
  isTodayHoliday: () => Promise<boolean>;
}
