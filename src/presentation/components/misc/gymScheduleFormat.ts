// 순수 함수: 헬스장 수업 목록(flat) → 시간×요일 그리드 변환, 같은 과목이 연속된 시간대에 걸쳐
// 있으면 하나의 셀로 rowSpan 병합. "시간×요일 그리드"는 이 테이블 UI 전용 표현이라 도메인이 아닌
// presentation에 위치 (도메인은 GymClassSession 목록만 들고 있음)
import type { GymClassSession } from '../../../domain/entities/Gym.js';

export interface GymScheduleCell {
  name: string;
  type: string;
  endTime?: string;
}

type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri';
const DAYS: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri'];
const DAY_KEY: Record<GymClassSession['dayOfWeek'], DayKey> = {
  MON: 'mon', TUE: 'tue', WED: 'wed', THU: 'thu', FRI: 'fri',
};

export interface GymScheduleRow {
  hour: number;
  label: string;
  mon: GymScheduleCell | '-';
  tue: GymScheduleCell | '-';
  wed: GymScheduleCell | '-';
  thu: GymScheduleCell | '-';
  fri: GymScheduleCell | '-';
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

// classId가 이 기간(period) 안에서 처음 등장하는 순서대로 팔레트를 순환 배정
function buildColorMap(classes: GymClassSession[], colorPalette: string[]): Map<number, string> {
  const colorByClassId = new Map<number, string>();
  classes.forEach(c => {
    if (!colorByClassId.has(c.classId)) {
      colorByClassId.set(c.classId, colorPalette[colorByClassId.size % colorPalette.length]);
    }
  });
  return colorByClassId;
}

// flat한 수업 목록을 openHour~closeHour 범위의 시간×요일 그리드로 변환.
export function buildScheduleGrid(
  classes: GymClassSession[],
  openHour: number,
  closeHour: number,
  colorPalette: string[]
): GymScheduleRow[] {
  const colorByClassId = buildColorMap(classes, colorPalette);

  const rows: GymScheduleRow[] = [];
  for (let hour = openHour; hour <= closeHour; hour++) {
    const row: GymScheduleRow = { hour, label: String(hour).padStart(2, '0'), mon: '-', tue: '-', wed: '-', thu: '-', fri: '-' };
    const hourStart = hour * 60;
    const hourEnd = hourStart + 60;

    classes.forEach(c => {
      const dayKey = DAY_KEY[c.dayOfWeek];
      if (!dayKey) return;
      const startMin = toMinutes(c.startTime);
      const endMin = toMinutes(c.endTime);
      if (startMin >= hourEnd || endMin <= hourStart) return; // 이 시간대와 안 겹침

      const cell: GymScheduleCell = { name: c.className, type: colorByClassId.get(c.classId)! };
      // 이 시간대가 수업의 마지막 칸이면서 정시에 안 끝나면 endTime 표기 (부분 높이 렌더링용)
      if (endMin <= hourEnd && endMin % 60 !== 0) {
        cell.endTime = c.endTime;
      }
      row[dayKey] = cell;
    });

    rows.push(row);
  }
  return rows;
}

export interface MergedGymScheduleRow extends Omit<GymScheduleRow, DayKey> {
  spans: Partial<Record<DayKey, number>>;
  mon: GymScheduleCell | '-' | null;
  tue: GymScheduleCell | '-' | null;
  wed: GymScheduleCell | '-' | null;
  thu: GymScheduleCell | '-' | null;
  fri: GymScheduleCell | '-' | null;
}

export function getMergedSchedule(baseSchedule: GymScheduleRow[]): MergedGymScheduleRow[] {
  const merged: MergedGymScheduleRow[] = baseSchedule.map(row => ({ ...row, spans: {} }));
  DAYS.forEach(day => {
    for (let i = 0; i < baseSchedule.length; i++) {
      const current = baseSchedule[i][day];
      if (current === '-' || current === null) continue;
      let span = 1;
      while (i + span < baseSchedule.length) {
        const next = baseSchedule[i + span][day];
        if (next === '-' || next === null || (next as GymScheduleCell).name !== (current as GymScheduleCell).name) break;
        span++;
      }
      if (span > 1) {
        merged[i].spans[day] = span;
        const lastCell = baseSchedule[i + span - 1][day] as GymScheduleCell;
        if (lastCell?.endTime) merged[i][day] = { ...(merged[i][day] as GymScheduleCell), endTime: lastCell.endTime };
        for (let j = 1; j < span; j++) merged[i + j][day] = null;
        i += span - 1;
      }
    }
  });
  return merged;
}
