// ⚠️ .toISOString()으로만 읽을 것 — .getFullYear()/.getHours() 같은 로컬 getter로 읽으면
// 기기가 이미 KST일 때 9시간이 중복으로 밀려서 틀어진다. (cafeteriaFormat.tsx/toDateKey/WeatherCard.tsx 참고)
export const getKSTDate = (): Date => new Date(new Date().getTime() + 9 * 60 * 60 * 1000);

// 기기 타임존과 무관하게 "진짜 KST 지금"의 년/월/일/시/분/요일을 뽑아냄
export function getKSTParts() {
  const shifted = getKSTDate();
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(), // 0~11
    date: shifted.getUTCDate(),
    hours: shifted.getUTCHours(),
    minutes: shifted.getUTCMinutes(),
    day: shifted.getUTCDay(), // 0=일요일 ~ 6=토요일
  };
}

// KST 기준 "오늘 자정" — 숫자 생성자로 새로 만든 Date라 이후 로컬 getter/연산으로 자유롭게 써도 안전
export function getKSTToday(): Date {
  const { year, month, date } = getKSTParts();
  return new Date(year, month, date);
}

// KST 기준 "지금"(분 단위) — 위와 동일한 이유로 로컬 getter로 읽어도 안전
export function getKSTNow(): Date {
  const { year, month, date, hours, minutes } = getKSTParts();
  return new Date(year, month, date, hours, minutes);
}

// 도서관(library) API 전용: updatedAt이 UTC인데 타임존 표기가 없다(예: '2026-08-18 02:27:00')
// ⚠️ 날씨(forecastAt)는 반대로 이미 KST인 채로 오프셋 없이 내려오므로 이 함수를 쓰면 안 된다
const DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/;

export function formatKSTHourMinute(value: string): string | null {
  const matched = DATE_TIME.exec(value);
  if (!matched) return null;

  const [, year, month, date, hours, minutes, seconds = '0'] = matched;
  const utcMs = Date.UTC(Number(year), Number(month) - 1, Number(date), Number(hours), Number(minutes), Number(seconds));
  const kst = new Date(utcMs + 9 * 60 * 60 * 1000);

  return `${String(kst.getUTCHours()).padStart(2, '0')}:${String(kst.getUTCMinutes()).padStart(2, '0')}`;
}

// 서버가 준 시각 문자열을 epoch(ms)으로. 시각 비교·차이 계산은 이 절대값으로만 해야 안전하다.
const HAS_OFFSET = /(?:Z|[+-]\d{2}:\d{2})$/;

export function toEpoch(value: string): number {
  return new Date(HAS_OFFSET.test(value) ? value : `${value}+09:00`).getTime();
}

// KST 기준 오늘 날짜 키 (YYYY-MM-DD)
export function getKSTDateKey(): string {
  const { year, month, date } = getKSTParts();
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
}

// 학식 API
// 임의의 Date를 'YYYY-MM-DD' 문자열로. getKSTDate()가 만든 Date를 넣을 것을 전제로
// toISOString()으로만 읽는다 — 로컬 getter를 쓰면 위 경고와 같은 이유로 날짜가 틀어진다.
export function toDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}
