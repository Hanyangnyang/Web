// 순수 함수: 다가오는 학기/방학/계절학기 전환 판정 + 배너 문구 조립 (React/시간대 의존 없이 Date만 받아 계산)

export interface PeriodScheduleItem {
  start: string; // YYYY-MM-DD
  name: string;
}

// period_schedule 중 오늘(today) 기준 7일 이내에 시작하는 가장 이른 항목을 찾음
export function findUpcomingSchedule(
  periodSchedule: PeriodScheduleItem[] | undefined,
  today: Date
): PeriodScheduleItem | null {
  if (!periodSchedule || periodSchedule.length === 0) return null;

  const futureSchedules = periodSchedule.filter(item => {
    const parts = item.start.split('-');
    if (parts.length !== 3) return false;
    const startDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    const diffTime = startDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 7;
  });

  if (futureSchedules.length === 0) return null;

  return [...futureSchedules].sort((a, b) => a.start.localeCompare(b.start))[0];
}

const PERIOD_DISPLAY_NAME: Record<string, string> = {
  '학기중': '정규학기',
  '방학중': '방학',
  '계절학기': '계절학기',
};

const WEEKDAYS = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

function getMonday(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.getFullYear(), d.getMonth(), diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

// "N월 N일부터 정규학기 시간표로 변경됩니다" 형태의 배너 문구 조립
export function formatUpcomingScheduleMessage(schedule: PeriodScheduleItem, today: Date): string {
  const parts = schedule.start.split('-');
  let formattedStartDate = '';
  if (parts.length === 3) {
    const targetDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));

    const todayMonday = getMonday(today);
    const targetMonday = getMonday(targetDate);

    const diffWeeks = Math.round((targetMonday.getTime() - todayMonday.getTime()) / (1000 * 60 * 60 * 24 * 7));
    const dayName = WEEKDAYS[targetDate.getDay()];

    if (diffWeeks === 0) {
      formattedStartDate = `이번 주 ${dayName}`;
    } else if (diffWeeks === 1) {
      formattedStartDate = `다음 주 ${dayName}`;
    } else {
      formattedStartDate = `${parseInt(parts[1], 10)}월 ${parseInt(parts[2], 10)}일`;
    }
  }

  const periodDisplayName = PERIOD_DISPLAY_NAME[schedule.name] || schedule.name;
  return `${formattedStartDate}부터 ${periodDisplayName} 시간표로 변경됩니다 😊`;
}
