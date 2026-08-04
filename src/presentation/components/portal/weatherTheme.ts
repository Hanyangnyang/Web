// 순수 함수: 날씨 코드 → 아이콘/테마 매핑 (React 상태 없이 값만 계산)
import { CloudRain, Snowflake, Wind, Sun, Moon, Cloud, CloudSun, CloudMoon, CloudFog, CloudDrizzle, CloudLightning, type LucideIcon } from 'lucide-react';
import type { Weather } from '../../../domain/entities/Weather.js';

// 시간별 예보 2D 아이콘 매핑
export function getHourlyIcon(code: number, hour: number): LucideIcon {
  const isNight = hour >= 20 || hour < 6;
  if (code <= 0) return isNight ? Moon : Sun;
  if (code <= 1) return isNight ? CloudMoon : CloudSun;
  if (code <= 2) return CloudSun;
  if (code <= 3) return Cloud;
  if (code <= 48) return CloudFog;
  if (code <= 67) return CloudRain;
  if (code <= 77) return Snowflake; // 비 아이콘(CloudRain)과 구분되도록 구름 없는 눈송이 아이콘 사용
  if (code <= 82) return CloudDrizzle;
  return CloudLightning;
}

// 구름은 흰색으로 아이콘 내부를 채우고, 해·달·눈송이는 테두리만 표시
export function getHourlyIconFill(Icon: LucideIcon): string {
  if (
    Icon === Cloud ||
    Icon === CloudSun ||
    Icon === CloudMoon ||
    Icon === CloudFog ||
    Icon === CloudRain ||
    Icon === CloudDrizzle ||
    Icon === CloudLightning
  ) {
    return '#ffffff';
  }
  return 'none';
}

export interface WeatherTheme {
  icon: LucideIcon | null;
  bg: string;
  iconColor?: string;
}

// 날씨 상태에 따른 프리미엄 동적 테마 정의 (배경 그라데이션 및 매칭 아이콘)
export function getWeatherTheme(weather: Weather | null): WeatherTheme {
  if (!weather) return { icon: null, bg: 'transparent' };
  const code = weather.weatherCode;

  // 1. 맑음 / 대체로 맑음 (0, 1)
  if (code <= 1) {
    const isHot = weather.temp >= 28;
    return {
      icon: Sun,
      bg: isHot
        ? 'linear-gradient(135deg, #FAD961 0%, #F76B1C 100%)' // 28도 이상: 찬란하고 강렬한 골드&오렌지 햇살 (빛이 들어오는 느낌)
        : 'linear-gradient(135deg, #00B4DB 0%, #0083B0 100%)'  // 28도 미만: 청량하고 깨끗한 시원한 스카이 블루
    };
  }
  // 2. 구름 조금 (2) -> 화사하고 밝은 파스텔톤의 소프트 블루스카이
  if (code === 2) {
    return {
      icon: Cloud,
      bg: 'linear-gradient(135deg, #4a779d 0%, #7db9e8 100%)'
    };
  }
  // 3. 흐림 / 안개 (3, 45, 48) -> 밝고 화사한 프리미엄 클라우드 그레이
  if (code === 3 || code <= 48) {
    return {
      icon: code <= 3 ? Cloud : Wind,
      bg: 'linear-gradient(135deg, #a1b0be 0%, #66788a 100%)'
    };
  }
  // 4. 눈 (71 ~ 77) -> 눈 결정 아이콘 + 눈부시게 밝은 설원과 순백의 화이트 스카이
  if (code >= 71 && code <= 77) {
    return {
      icon: Snowflake,
      bg: 'linear-gradient(135deg, #8ca0ba 0%, #ffffff 100%)',
      iconColor: '#4A607A'
    };
  }
  // 5. 비 / 소나기 / 뇌우 -> 깊고 차분한 딥스톰 퍼플그레이
  return {
    icon: CloudRain,
    bg: 'linear-gradient(135deg, #2b5876 0%, #4e4376 100%)'
  };
}
