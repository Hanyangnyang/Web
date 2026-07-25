// 도메인 엔티티: 소식탭 날씨 정보

export interface HourlyForecastItem {
  time: string;
  epoch: number;
  hour: number;
  temp: number;
  weatherCode: number;
  precipProb: number;
}

export interface AirQualityLevel {
  label: string;
  color: string;
  level: number;
}

export interface AirQuality {
  pm10: AirQualityLevel;
  pm25: AirQualityLevel;
  uv: AirQualityLevel;
}

export interface WeatherInput {
  temp: number;
  description: string;
  emoji: string;
  weatherCode: number;
  message: string;
  isAiMessage?: boolean;
  hasPrecipitation?: boolean;
  hourlyForecast?: HourlyForecastItem[];
  airQuality?: AirQuality | null;
}

export interface Weather extends WeatherInput {
  isAiMessage: boolean;
  hasPrecipitation: boolean;
  hourlyForecast: HourlyForecastItem[];
  airQuality: AirQuality | null;
}

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
}: WeatherInput): Weather => ({
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
