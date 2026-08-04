// 도메인 엔티티: 체대 헬스장 시간표

export interface GymScheduleCell {
  name: string;
  type: string;
  endTime?: string;
}

export interface GymScheduleRow {
  hour: number;
  label: string;
  mon: GymScheduleCell | '-';
  tue: GymScheduleCell | '-';
  wed: GymScheduleCell | '-';
  thu: GymScheduleCell | '-';
  fri: GymScheduleCell | '-';
}

export interface GymPeriod {
  id: string;
  name: string;
  title: string;
  startDate: string;
  endDate: string;
  hours: string;
  schedule: GymScheduleRow[];
}

export interface GymSchedule {
  location: string;
  periods: GymPeriod[];
}

// GymApiDataSource의 raw 응답을 도메인 엔티티로 변환 — 지금은 필드가 그대로 대응되지만,
// 나중에 실제 백엔드 API가 다른 필드명/형식으로 내려줘도 이 함수만 고치면 나머지 도메인/
// 프레젠테이션 로직은 안 바뀜
export function createGymSchedule(raw: { location: string; periods: GymPeriod[] }): GymSchedule {
  return {
    location: raw.location,
    periods: raw.periods,
  };
}
