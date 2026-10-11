import { Cloud, CloudDrizzle, CloudMoon, CloudRain, CloudSun, Moon, Snowflake, Sun, type LucideIcon } from 'lucide-react';
import type { Weather, WeatherCondition, PmGrade, UvGrade } from '../../../domain/entities/Weather.js';

// 날씨 상태 라벨 
export const CONDITION_LABEL: Record<WeatherCondition, string> = {
  SUNNY: '맑음',
  MOSTLY_CLOUDY: '구름많음',
  CLOUDY: '흐림',
  RAIN: '비',
  RAIN_SNOW: '비/눈',
  SNOW: '눈',
  SHOWER: '소나기',
};
export const UNKNOWN_CONDITION_LABEL = '정보 없음';


// 시간별 예보 아이콘 
const HOURLY_ICON: Record<WeatherCondition, { day: LucideIcon; night: LucideIcon }> = {
  SUNNY:         { day: Sun,          night: Moon },
  MOSTLY_CLOUDY: { day: CloudSun,     night: CloudMoon },
  CLOUDY:        { day: Cloud,        night: Cloud },
  RAIN:          { day: CloudRain,    night: CloudRain },
  RAIN_SNOW:     { day: CloudRain,    night: CloudRain },  // 진눈깨비는 비 쪽으로 본다
  SNOW:          { day: Snowflake,    night: Snowflake },
  SHOWER:        { day: CloudDrizzle, night: CloudDrizzle },
};

export function getHourlyIcon(condition: WeatherCondition | null, hour: number): LucideIcon {
  if (!condition) return Cloud;
  const isNight = hour >= 20 || hour < 6;
  const icons = HOURLY_ICON[condition];
  return isNight ? icons.night : icons.day;
}

const FILLED_ICONS: readonly LucideIcon[] = [Cloud, CloudSun, CloudMoon, CloudRain, CloudDrizzle];

export const getHourlyIconFill = (Icon: LucideIcon): string => 
  FILLED_ICONS.includes(Icon) ? '#ffffff' : 'none';


// 카드 배경 테마 
export interface WeatherTheme {
  icon: LucideIcon | null;
  bg: string;
  iconColor?: string;
}

const HOT_TEMP = 28;

const BG = {
  hotSunny:  'linear-gradient(135deg, #FAD961 0%, #F76B1C 100%)', // 빛이 들어오는 골드&오렌지
  coolSunny: 'linear-gradient(135deg, #00B4DB 0%, #0083B0 100%)', // 청량한 스카이블루
  partly:    'linear-gradient(135deg, #4a779d 0%, #7db9e8 100%)', // 파스텔 소프트블루
  cloudy:    'linear-gradient(135deg, #a1b0be 0%, #66788a 100%)', // 프리미엄 클라우드그레이
  snow:      'linear-gradient(135deg, #8ca0ba 0%, #ffffff 100%)', // 눈부신 설원
  rain:      'linear-gradient(135deg, #2b5876 0%, #4e4376 100%)', // 깊은 딥스톰 퍼플그레이
};

const THEME: Record<WeatherCondition, WeatherTheme> = {
  SUNNY:         { icon: Sun,       bg: BG.coolSunny },
  MOSTLY_CLOUDY: { icon: Cloud,     bg: BG.partly },
  CLOUDY:        { icon: Cloud,     bg: BG.cloudy },
  RAIN:          { icon: CloudRain, bg: BG.rain },
  RAIN_SNOW:     { icon: CloudRain, bg: BG.rain },
  SNOW:          { icon: Snowflake, bg: BG.snow, iconColor: '#4A607A' },
  SHOWER:        { icon: CloudRain, bg: BG.rain },
};

export function getWeatherTheme(weather: Weather | null): WeatherTheme {
  if (!weather) return { icon: null, bg: 'transparent' };

  const { condition, temp } = weather.current;
  if (!condition) return { icon: Cloud, bg: BG.cloudy };

  if (condition === 'SUNNY' && temp >= HOT_TEMP) return { icon: Sun, bg: BG.hotSunny };
  return THEME[condition];
}

// 대기질 등급색 
export const PM_COLOR: Record<PmGrade, string> = {
  '좋음': '#38bdf8',
  '보통': '#4ade80',
  '나쁨': '#ef4444',
  '매우나쁨': '#991b1b',
};

export const UV_COLOR: Record<UvGrade, string> = {
  '낮음': '#38bdf8',
  '보통': '#4ade80',
  '높음': '#fbbf24',
  '매우높음': '#ef4444',
  '위험': '#991b1b',
};

// 측정소 점검 등으로 등급이 없을 때
export const UNKNOWN_GRADE_LABEL = '점검중';
export const UNKNOWN_GRADE_COLOR = '#94a3b8';

// PmGrade/UvGrade처럼 "값이 있으면 그 등급, null이면 점검중"인 필드 공용 매칭 함수
export function gradeLabel<T extends string>(grade: T | null): string {
  return grade ?? UNKNOWN_GRADE_LABEL;
}

export function gradeColor<T extends string>(grade: T | null, colorMap: Record<T, string>): string {
  return grade ? colorMap[grade] : UNKNOWN_GRADE_COLOR;
}
