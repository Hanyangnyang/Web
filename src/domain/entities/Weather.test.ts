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
      hourlyForecast: [{ time: '2026-07-25T12:00', epoch: 1721000000000, hour: 12, temp: 24, weatherCode: 1, precipProb: 0 }],
      airQuality: {
        pm10: { label: '좋음', color: '#2563eb', level: 1 },
        pm25: { label: '좋음', color: '#2563eb', level: 1 },
        uv: { label: '보통', color: '#4ade80', level: 2 },
      },
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
