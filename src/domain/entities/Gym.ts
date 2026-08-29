// 도메인 엔티티: 체대 헬스장 시간표 (기간 메타데이터 + 요일별 수업 세션 목록)
// "시간×요일 그리드"로 변환하는 건 테이블 UI 전용 표현이라 presentation/gymScheduleFormat.ts에 위치

export interface GymClassSession {
  dayOfWeek: 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI';
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  classId: number;
  className: string;
}

export interface GymPeriod {
  id: string;
  periodType: 'semester' | 'seasonal' | 'vacation';
  title: string;
  startDate: string;
  endDate: string;
  openTime: string;  // "HH:mm"
  closeTime: string; // "HH:mm"
  classes: GymClassSession[];
}

export interface GymSchedule {
  location: string;
  periods: GymPeriod[];
}
