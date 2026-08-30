// 도메인 엔티티: 소식탭 날씨 정보

export const WEATHER_CONDITIONS = [
  'SUNNY',          // 맑음
  'MOSTLY_CLOUDY',  // 구름많음
  'CLOUDY',         // 흐림
  'RAIN',           // 비
  'RAIN_SNOW',      // 비/눈
  'SNOW',           // 눈
  'SHOWER',         // 소나기
] as const;
export type WeatherCondition = typeof WEATHER_CONDITIONS[number];
export type PmGrade = '좋음' | '보통' | '나쁨' | '매우나쁨';
export type UvGrade = '낮음' | '보통' | '높음' | '매우높음' | '위험';

// DTO → 엔티티 변환 헬퍼
export const toWeatherCondition = (raw: string | null): WeatherCondition | null =>
  raw !== null && (WEATHER_CONDITIONS as readonly string[]).includes(raw)
    ? (raw as WeatherCondition)
    : null;

// pm, 미세먼지 등급 매치
const PM_GRADE_BY_CODE: Record<number, PmGrade> = {
  1: '좋음',
  2: '보통',
  3: '나쁨',
  4: '매우나쁨',
};
export const toPmGrade = (code: number | null): PmGrade | null =>
  code === null ? null : PM_GRADE_BY_CODE[code] ?? null;

// uv, 자외선 등급 매치
export const toUvGrade = (uvIndex: number | null): UvGrade | null => {
  if (uvIndex === null) return null;
  if (uvIndex >= 9) return '위험';
  if (uvIndex >= 7) return '매우높음';
  if (uvIndex >= 5) return '높음';
  if (uvIndex >= 3) return '보통';
  return '낮음';
};

// 엔티티 정의
export interface WeatherSnapshot {
  epoch: number;
  temp: number;                        // ℃
  condition: WeatherCondition | null;  
}

export interface HourlyForecast extends WeatherSnapshot {
  precipProb: number;                  // %
}

export interface CurrentWeather extends WeatherSnapshot {
  maxTemp: number | null;
  minTemp: number | null;
  pm10Grade: PmGrade | null;
  pm25Grade: PmGrade | null;
  uvGrade: UvGrade | null;
}

export interface Weather {
  current: CurrentWeather;
  hourly: HourlyForecast[];
}
