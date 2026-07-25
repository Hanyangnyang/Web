import { describe, it, expect } from 'vitest';
import { createWeather } from './Weather.js';

describe('createWeather', () => {
  it('API 응답 필드를 그대로 보존한다', () => {
    const raw = {
      temp: 24,
      description: '맑음',
      emoji: '☀️',
      weatherCode: 1,
      message: '오늘 날씨 좋아요',
      isAiMessage: true,
      hasPrecipitation: false,
      hourlyForecast: [{ epoch: 1721000000000, temp: 24 }],
      airQuality: { pm10: { label: '좋음' }, pm25: { label: '좋음' }, uv: { label: '보통' } },
    };
    expect(createWeather(raw)).toEqual(raw);
  });

  it('isAiMessage/hasPrecipitation/hourlyForecast/airQuality가 없으면 기본값을 쓴다', () => {
    const weather = createWeather({ temp: 20, description: '흐림', emoji: '☁️', weatherCode: 3, message: '구름 많음' });
    expect(weather.isAiMessage).toBe(false);
    expect(weather.hasPrecipitation).toBe(false);
    expect(weather.hourlyForecast).toEqual([]);
    expect(weather.airQuality).toBeNull();
  });
});
