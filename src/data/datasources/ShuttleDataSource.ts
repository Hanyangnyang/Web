// 데이터 소스: 셔틀 시간표 JSON 및 지하철 도착 정보 API 원시 호출

import type { HttpClient } from '../../infrastructure/http/HttpClient.js';

export interface ShuttleScheduleRow {
  route: string;
  period: string;
  dayType: string;
  dep: string;
}

export interface SubwayArrivalApiItem {
  subwayId: string;
  updnLine: string;
  dest: string;
  arrTime: string;
  trainNo: string;
  isRealtime: boolean;
}

export interface SubwayArrivalsApiResponse {
  arrivals?: SubwayArrivalApiItem[];
  offPeak?: boolean;
  isHoliday?: boolean;
}

export interface ShuttleDataSource {
  fetchScheduleData: () => Promise<ShuttleScheduleRow[]>;
  fetchSubwayArrivals: (full?: boolean, dayType?: string | null) => Promise<SubwayArrivalsApiResponse>;
}

export const createShuttleDataSource = ({ httpClient }: { httpClient: HttpClient }): ShuttleDataSource => ({
  fetchScheduleData: async () => {
    const res = await httpClient.get('/shuttle.json');
    return res.json();
  },

  fetchSubwayArrivals: async (full = false, dayType = null) => {
    let url = '/api/subway';
    const params = new URLSearchParams();
    if (full) params.append('full', 'true');
    if (dayType) params.append('dayType', dayType);
    const qs = params.toString();
    if (qs) url += `?${qs}`;

    const res = await httpClient.get(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
});
