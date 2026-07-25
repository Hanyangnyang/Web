// 도메인 엔티티: 소식탭 날씨 정보
export const createWeather = ({
  temp,
  description,
  emoji,
  weatherCode,
  message,
  isAiMessage = false,
  hasPrecipitation = false,
  hourlyForecast = [],
  airQuality = null,
}) => ({
  temp,
  description,
  emoji,
  weatherCode,
  message,
  isAiMessage,
  hasPrecipitation,
  hourlyForecast,
  airQuality,
});
