import { describe, it, expect } from 'vitest';
import { toWeatherCondition, toPmGrade, toUvGrade, WEATHER_CONDITIONS } from './Weather.js';

describe('toWeatherCondition', () => {
  it('우리가 아는 값은 그대로 통과시킨다', () => {
    WEATHER_CONDITIONS.forEach(condition => {
      expect(toWeatherCondition(condition)).toBe(condition);
    });
  });

  it('목록에 없는 값은 null로 흘려보낸다', () => {
    // 백엔드가 FOG 같은 새 상태를 추가해도, 우리 아이콘이 준비되기 전까지는
    // 화면이 깨지는 대신 "정보 없음"으로 버텨야 한다.
    expect(toWeatherCondition('FOG')).toBeNull();
    expect(toWeatherCondition('sunny')).toBeNull(); // 대소문자가 다르면 다른 값이다
    expect(toWeatherCondition('')).toBeNull();
  });

  it('예보 수신 전(null)도 null이다', () => {
    expect(toWeatherCondition(null)).toBeNull();
  });
});

describe('toPmGrade', () => {
  it('서버 등급 코드를 우리말 등급으로 옮긴다', () => {
    expect(toPmGrade(1)).toBe('좋음');
    expect(toPmGrade(2)).toBe('보통');
    expect(toPmGrade(3)).toBe('나쁨');
    expect(toPmGrade(4)).toBe('매우나쁨');
  });

  it('점검중(null)은 등급이 아니라 등급 없음으로 다룬다', () => {
    // 측정소 점검 등으로 등급이 안 오는 경우. PmGrade에 '점검중'을 넣지 않는 이유는
    // "점검중은 좋음보다 나쁜가?" 같은 답 없는 비교가 가능해지기 때문이다.
    expect(toPmGrade(null)).toBeNull();
  });

  it('표에 없는 코드는 null이다', () => {
    // 스펙상 pm10Grade는 그냥 integer라 1~4를 벗어난 값이 올 수 있다.
    // 그때 undefined가 화면까지 새어나가지 않아야 한다.
    expect(toPmGrade(0)).toBeNull();
    expect(toPmGrade(5)).toBeNull();
  });
});

describe('toUvGrade', () => {
  // 구간 판정은 경계가 하나만 어긋나도 전 구간이 한 칸씩 밀리므로, 구간마다 양 끝을 확인한다
  it('0~2는 낮음', () => {
    expect(toUvGrade(0)).toBe('낮음');
    expect(toUvGrade(2)).toBe('낮음');
  });

  it('3~4는 보통', () => {
    expect(toUvGrade(3)).toBe('보통');
    expect(toUvGrade(4)).toBe('보통');
  });

  it('5~6은 높음', () => {
    expect(toUvGrade(5)).toBe('높음');
    expect(toUvGrade(6)).toBe('높음');
  });

  it('7~8은 매우높음', () => {
    expect(toUvGrade(7)).toBe('매우높음');
    expect(toUvGrade(8)).toBe('매우높음');
  });

  it('9 이상은 위험', () => {
    // 서버 관측 표는 10까지지만 지수 자체는 상한이 없어, 그 위도 위험으로 떨어져야 한다
    expect(toUvGrade(9)).toBe('위험');
    expect(toUvGrade(10)).toBe('위험');
    expect(toUvGrade(15)).toBe('위험');
  });
});
