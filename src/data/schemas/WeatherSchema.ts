// 날씨/대기질/UV API 응답 스키마 — 런타임 검증과 DTO 타입을 zod 하나로 통일
import { z } from 'zod';

// 시간별 예보 개별 항목. 배열 안에서 항목 하나가 이상해도(온도가 숫자가 아님 등) 그 항목만
// 제외하고 싶어서 상위 스키마에 배열로 중첩하지 않고 Repository에서 항목별로 개별 parse한다
export const HourlyForecastDtoSchema = z.object({
  forecastAt: z.string(),
  temperature: z.number(),
  weatherCondition: z.string().nullable().catch(null),
  precipProbability: z.number().catch(0),
});

// 현재 날씨. temperature는 화면에 반드시 필요한 핵심 값이라 여기서 실패하면(숫자 아님/누락)
// 응답 전체를 에러로 취급하고, 나머지 부가 필드는 이상해도 null로 대체(.catch(null))
export const CurrentWeatherDtoSchema = z.object({
  forecastAt: z.string(),
  temperature: z.number(),
  weatherCondition: z.string().nullable().catch(null),
  maxTemperature: z.number().nullable().catch(null),
  minTemperature: z.number().nullable().catch(null),
  pm10Grade: z.number().nullable().catch(null),
  pm25Grade: z.number().nullable().catch(null),
  uvIndex: z.number().nullable().catch(null),
});

export const WeatherResponseDataSchema = z.object({
  current: CurrentWeatherDtoSchema,
  hourly: z.array(z.unknown()).catch([]), // 개별 항목 검증은 HourlyForecastDtoSchema로 Repository에서 수행
});

export type HourlyForecastDto = z.infer<typeof HourlyForecastDtoSchema>;
export type CurrentWeatherDto = z.infer<typeof CurrentWeatherDtoSchema>;
