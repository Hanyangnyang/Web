// 데이터 소스: 체대 헬스장 시간표 새 백엔드(/api/v1/gym/gym-periods) 원시 호출
import { parseOrThrow, type ApiResponse, type HttpClient } from '../../infrastructure/http/HttpClient.js';

export interface GymScheduleDto{
    id: number;
    dayOfWeek: "MON" | 'TUE' | 'WED' | 'THU' | 'FRI';
    startTime: string;
    endTime: string;
    classId: number;
    className: string;
}

export interface GymPeriodDto{
    id: number;
    year: number;
    semester: "FIRST" | "SECOND";
    periodType: 'SEMESTER' | 'SEASONAL' | 'VACATION';
    title: string;
    start_date: string;
    end_date: string;
    start_time: string;
    end_time: string;
    active_weekend: boolean;
    timeStamp: string;
    schedules: GymScheduleDto[];
}

export interface GymApiDataSource{
    getSchedule: () => Promise<ApiResponse<GymPeriodDto[]>>;
}

export const createGymApiDataSource = ({httpClient}:{httpClient: HttpClient}) : GymApiDataSource => ({
    getSchedule: async () => parseOrThrow(await httpClient.get('/api/v1/gym/gym-periods')),
})
