// 기기 시간대와 무관하게 "지금 이 순간의 KST 벽시계 시각"을 UTC 게터로 읽어낼 수 있도록 만든 트릭용 Date
// 이름의 Unsafe: 겉보기엔 평범한 Date라 getFullYear()/getHours() 같은 로컬 getter로 무심코 읽기 쉬운데,
// 그러면 기기가 이미 KST일 때 9시간이 중복으로 밀려서(총 18시간) 틀어진다 — 그래서 직접 호출하지 말 것
// 입력: 없음 → 출력: Date (epoch = 진짜 지금의 UTC epoch + 9시간)
// ⚠️ 반드시 getUTC*() / toISOString()으로만 읽을 것. 대부분의 경우 이 함수 대신 아래의
// getKSTParts()/getKSTToday()/getKSTNow()(안전하게 읽을 수 있는 값을 돌려줌)를 쓰면 된다
export const getKSTDateUnsafe = (): Date => new Date(new Date().getTime() + 9 * 60 * 60 * 1000);

// getKSTDateUnsafe()를 UTC 게터로 분해해서 "진짜 KST 지금"의 각 필드를 뽑아냄 (기기 타임존 무관)
// 입력: 없음 → 출력: { year, month(0~11), date, hours, minutes, day(0=일요일~6=토요일) }
export function getKSTParts() {
  const shifted = getKSTDateUnsafe();
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(), // 0~11
    date: shifted.getUTCDate(),
    hours: shifted.getUTCHours(),
    minutes: shifted.getUTCMinutes(),
    day: shifted.getUTCDay(), // 0=일요일 ~ 6=토요일
  };
}

// KST 기준 "오늘 자정"을 로컬 Date 생성자로 새로 만듦 — 트릭 Date가 아니라 진짜 로컬 Date라 이후 로컬 getter/연산으로 자유롭게 써도 안전
// 입력: 없음 → 출력: Date (그 기기 로컬 자정 시각, 연/월/일 필드는 KST 기준)
export function getKSTToday(): Date {
  const { year, month, date } = getKSTParts();
  return new Date(year, month, date);
}

// KST 기준 "지금"(분 단위)을 로컬 Date 생성자로 새로 만듦 — 위와 동일한 이유로 로컬 getter로 읽어도 안전
// 입력: 없음 → 출력: Date (그 기기 로컬 시각, 연/월/일/시/분 필드는 KST 기준, 초 이하는 0)
export function getKSTNow(): Date {
  const { year, month, date, hours, minutes } = getKSTParts();
  return new Date(year, month, date, hours, minutes);
}

// 도서관 API 전용: updatedAt이 UTC인데 타임존 표기가 없는 문자열을 KST 시:분으로 변환
// 입력: 'YYYY-MM-DD HH:mm[:ss]' 또는 'YYYY-MM-DDTHH:mm[:ss]' 형태 문자열(오프셋 없음, UTC로 간주) → 출력: 'HH:mm' 문자열, 파싱 실패 시 null
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

// 서버가 준 시각 문자열을 절대값(epoch ms)으로 변환. 시각 비교·차이 계산은 이 값으로만 해야 안전하다
// 입력: 오프셋 있는 문자열('...Z' 또는 '...+09:00') 또는 오프셋 없는 문자열(KST로 간주해 '+09:00' 보정) → 출력: number (1970-01-01 UTC 기준 ms)
const HAS_OFFSET = /(?:Z|[+-]\d{2}:\d{2})$/;

export function toEpoch(value: string): number {
  return new Date(HAS_OFFSET.test(value) ? value : `${value}+09:00`).getTime();
}

// KST 기준 오늘 날짜를 캐시 키 등으로 쓸 문자열로 변환
// 입력: 없음 → 출력: 'YYYY-MM-DD' 문자열 (KST 기준 오늘)
export function getKSTDateKey(): string {
  const { year, month, date } = getKSTParts();
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
}

// 학식 API 전용: 임의의 Date를 'YYYY-MM-DD' 문자열로 변환
// 입력: Date (getKSTDateUnsafe()가 만든 트릭 Date를 넣는 것을 전제) → 출력: 'YYYY-MM-DD' 문자열
// ⚠️ toISOString()으로만 읽는다 — 로컬 getter를 쓰면 위와 같은 이유로 날짜가 틀어진다
export function toDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}
