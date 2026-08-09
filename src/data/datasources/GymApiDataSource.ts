// 데이터 소스: 체대 헬스장 시간표 원시 호출
import { parseOrThrow, type HttpClient } from '../../infrastructure/http/HttpClient.js';

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

export interface GymScheduleApiResponse {
  location: string;
  periods: GymPeriod[];
}

export interface GymApiDataSource {
  getSchedule: () => Promise<GymScheduleApiResponse>;
}

export const createGymApiDataSource = ({ httpClient }: { httpClient: HttpClient }): GymApiDataSource => ({
  getSchedule: async () => parseOrThrow(await httpClient.get('/gymSchedule.json')),
});
