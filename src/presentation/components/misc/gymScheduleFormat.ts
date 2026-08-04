// 순수 함수: 헬스장 시간표 셀 병합 (같은 과목이 연속된 시간대에 걸쳐 있으면 하나의 셀로 rowSpan 병합)
import type { GymScheduleCell, GymScheduleRow } from '../../../domain/entities/Gym.js';

type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri';
const DAYS: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri'];

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
