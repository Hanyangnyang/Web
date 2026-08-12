// ⚠️ .toISOString()으로만 읽을 것 — .getFullYear()/.getHours() 같은 로컬 getter로 읽으면
// 기기가 이미 KST일 때 9시간이 중복으로 밀려서 틀어진다. (cafeteriaFormat.tsx/useMenu.ts/WeatherCard.tsx 참고)
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

// 서버가 준 시각 문자열에서 'HH:MM'만 뽑는다. 형식이 안 맞으면 null(= 표시 생략).
const HOUR_MINUTE = /^\d{4}-\d{2}-\d{2}[T ](\d{2}):(\d{2})/;

export function formatKSTHourMinute(value: string): string | null {
  const matched = HOUR_MINUTE.exec(value);
  return matched ? `${matched[1]}:${matched[2]}` : null;
}

// KST 기준 오늘 날짜 키 (YYYY-MM-DD)
export function getKSTDateKey(): string {
  const { year, month, date } = getKSTParts();
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
}
