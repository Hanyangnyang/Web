// 곡 등록 임시 차단이 풀리는 시각(blockedUntil, ISO 8601)을 안내 문구용 한국 시각 문자열로 바꿈.
// 같은 날(KST)이면 "14:30", 다른 날이면 "10월 8일 14:30". 파싱할 수 없으면 null(호출부가 시각 없는 문구로 대체).
// 타임존 표기가 없는 문자열(예: "2026-10-08T14:30:00")은 서버 기준인 한국 시각(+09:00)으로 간주함
const HAS_TIMEZONE = /(Z|[+-]\d{2}:?\d{2})$/;

export function formatBlockedUntil(blockedUntil: string | null | undefined, now: Date = new Date()): string | null {
  if (!blockedUntil) return null;

  const date = new Date(HAS_TIMEZONE.test(blockedUntil) ? blockedUntil : `${blockedUntil}+09:00`);
  if (Number.isNaN(date.getTime())) return null;

  const parts = (d: Date) =>
    Object.fromEntries(
      new Intl.DateTimeFormat('ko-KR', {
        timeZone: 'Asia/Seoul',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
        .formatToParts(d)
        .map((p) => [p.type, p.value])
    ) as Record<string, string>;

  const target = parts(date);
  const current = parts(now);
  const hour = target.hour === '24' ? '00' : target.hour; // 일부 환경은 자정을 "24"로 줌
  const time = `${hour}:${target.minute}`;

  return target.month === current.month && target.day === current.day
    ? time
    : `${target.month}월 ${target.day}일 ${time}`;
}
