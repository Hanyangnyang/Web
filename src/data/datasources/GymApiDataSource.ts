// 데이터 소스: 체대 헬스장 시간표 새 백엔드(/api/v1/gym/gym-periods) 원시 호출
import { parseOrThrow, type ApiResponse, type HttpClient } from '../../infrastructure/http/HttpClient.js';

export interface GymTimeDto{
    hour: number;
    minute: number;
    second: number;
    nano: number;
}

export interface GymScheduleDto{
    id: number;
    dayOfWeek: "MON" | 'TUE' | 'WED' | 'THU' | 'FRI';
    startTime: GymTimeDto;
    endTime: GymTimeDto;
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
    start_time: GymTimeDto;
    end_time: GymTimeDto;
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
