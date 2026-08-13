// 데이터 소스: 소식탭 AI 날씨 브리핑 API 원시 호출
import { parseOrThrow, type ApiResponse, type HttpClient } from '../../infrastructure/http/HttpClient.js';

// 응답 구조
export interface WeatherBriefingResponseDto {
  location: string;    // 지역 코드. 서버 기본값이자 현재 유일하게 운영되는 값은 'ANSAN'
  content: string;     // AI가 생성한 한 줄 코멘트
  forecastAt: string;  // 'YYYY-MM-DDTHH:mm:ss' — 타임존 표기 없는 한국 시각. 브리핑이 생성된 기준 정각
}

// 요청 파라미터
export interface GetBriefingParams {
  location?: string;   // 생략 시 서버 기본값 ANSAN
  dateTime?: string;   // 'YYYY-MM-DDTHH:mm:ss'. 생략 시 가장 최근에 생성된 1건, 넣으면 그 시각 정각의 브리핑
}

export interface WeatherBriefingApiDataSource {
  getBriefing: (params?: GetBriefingParams) => Promise<ApiResponse<WeatherBriefingResponseDto>>;
}

export const createWeatherBriefingApiDataSource = ({ httpClient }: { httpClient: HttpClient }): WeatherBriefingApiDataSource => ({
  getBriefing: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.location) query.set('location', params.location);
    if (params.dateTime) query.set('dateTime', params.dateTime);

    const queryString = query.toString();
    return parseOrThrow(await httpClient.get(`/api/v1/weather/briefing${queryString ? `?${queryString}` : ''}`));
  },
});
