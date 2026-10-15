// 서버 차트 제목(displayTitle)에서 "언제 데이터인지"만 짧게 뽑은 문구 — 홈 인기차트 제목 옆, 인기차트 화면 헤더 부제목에 씀.
// 서버가 기간(주차 등)을 이미 계산해서 주므로 클라이언트에서 날짜로 다시 계산하지 않음(주 시작 요일 등 기준이 어긋날 수 있어서).
// 실서버 응답 형태(2026-10 확인):
//   실시간 "10.13 12:00 기준 실시간 급상승" → "12:00 기준" (오늘이 아니면 "10.13 12:00 기준")
//   주간   "10월 2주차 주간 차트"          → "10월 2주차"
//   월간   "2026년 9월 월간 차트"          → "9월" (올해가 아니면 "2026년 9월")
// 알 수 없는 형태면 잘못 자르지 않도록 null(표시 안 함)
export function toChartBasisLabel(displayTitle: string | undefined, now: Date): string | null {
  if (!displayTitle) return null;

  const realtime = displayTitle.match(/^(.*?기준)/)?.[1];
  if (realtime) {
    const today = `${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;
    return realtime.startsWith(`${today} `) ? realtime.slice(today.length + 1) : realtime;
  }

  const weekly = displayTitle.match(/\d{1,2}월 \d주차/)?.[0];
  if (weekly) return weekly;

  const monthly = displayTitle.match(/(\d{4})년 (\d{1,2}월)/);
  if (monthly) return Number(monthly[1]) === now.getFullYear() ? monthly[2] : `${monthly[1]}년 ${monthly[2]}`;

  return null;
}
