// 도메인 엔티티: AI가 생성한 날씨 브리핑 한 줄

export interface WeatherBriefing {
  location: string;
  content: string;
  forecastAt: string;  // 'YYYY-MM-DDTHH:mm:ss' — 브리핑이 생성된 기준 시각(한국 시각)
}

export const createWeatherBriefing = ({ location, content, forecastAt }: WeatherBriefing): WeatherBriefing => ({
  location,
  content: content.trim(),
  forecastAt,
});
