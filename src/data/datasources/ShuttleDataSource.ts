// 데이터 소스: 지하철 도착 정보 API 원시 호출 (셔틀 시간표는 ShuttleApiDataSource 참고)

export interface HttpClient {
  get: (path: string, headers?: Record<string, string>) => Promise<Response>;
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
  fetchSubwayArrivals: (full?: boolean, dayType?: string | null) => Promise<SubwayArrivalsApiResponse>;
}

export const createShuttleDataSource = ({ httpClient }: { httpClient: HttpClient }): ShuttleDataSource => ({
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
