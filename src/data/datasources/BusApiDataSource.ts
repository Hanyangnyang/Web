// 데이터 소스: 일반버스(공공데이터) 도착정보 API 원시 호출
import { parseOrThrow } from '../../infrastructure/http/HttpClient.js';

export interface HttpClient {
  get: (path: string, headers?: Record<string, string>) => Promise<Response>;
}

export interface BusArrivalListItem {
  routeName: string;
  routeDestName: string;
  predictTime1?: string | number;
  locationNo1?: string | number;
  remainSeatCnt1?: string | number;
  crowded1?: string | number;
  predictTime2?: string | number;
  locationNo2?: string | number;
  remainSeatCnt2?: string | number;
  crowded2?: string | number;
}

export interface BusArrivalApiResponse {
  response?: {
    msgBody?: {
      busArrivalList?: BusArrivalListItem | BusArrivalListItem[];
    };
  };
}

export interface BusApiDataSource {
  getArrivals: (stationId: string) => Promise<BusArrivalApiResponse>;
}

export const createBusApiDataSource = ({ httpClient }: { httpClient: HttpClient }): BusApiDataSource => ({
  getArrivals: async (stationId: string) => parseOrThrow(await httpClient.get(`/api/bus?stationId=${stationId}`)),
});
