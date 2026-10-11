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


// 카드 아이콘 테마 (카드는 흰 배경, 큰 배경 아이콘만 날씨별 색을 가진다)
export interface WeatherTheme {
  icon: LucideIcon | null;
  color: string;
}

// 예전 그라데이션 배경의 대표색
const COLOR = {
  sunny:     '#F76B1C', // 해는 기온과 상관없이 항상 주황
  partly:    '#0083B0', // 스카이블루
  cloudy:    '#66788a', // 클라우드그레이
  snow:      '#4A607A', // 설원
  rain:      '#4e4376', // 딥스톰 퍼플그레이
};

const THEME: Record<WeatherCondition, WeatherTheme> = {
  SUNNY:         { icon: Sun,       color: COLOR.sunny },
  MOSTLY_CLOUDY: { icon: Cloud,     color: COLOR.partly },
  CLOUDY:        { icon: Cloud,     color: COLOR.cloudy },
  RAIN:          { icon: CloudRain, color: COLOR.rain },
  RAIN_SNOW:     { icon: CloudRain, color: COLOR.rain },
  SNOW:          { icon: Snowflake, color: COLOR.snow },
  SHOWER:        { icon: CloudRain, color: COLOR.rain },
};

export function getWeatherTheme(weather: Weather | null): WeatherTheme {
  if (!weather) return { icon: null, color: 'transparent' };

  const { condition } = weather.current;
  if (!condition) return { icon: Cloud, color: COLOR.cloudy };

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
