import { RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';

// 쿨다운 중에 눌렀을 때 요청 없이 아이콘만 돌리는 시간 — 눌렀다는 반응만 주면 돼서 짧게
const FAKE_SPIN_MS = 600;
// "N분 전" 문구를 다시 계산하는 간격 — 분 단위 표기라 30초면 충분
const TICK_MS = 30_000;

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;

function formatUpdatedAgo(elapsedMs: number): string {
  if (elapsedMs < MINUTE_MS) return '방금 전';
  if (elapsedMs < HOUR_MS) return `${Math.floor(elapsedMs / MINUTE_MS)}분 전`;
  return `${Math.floor(elapsedMs / HOUR_MS)}시간 전`;
}

interface RefreshStampProps {
  updatedAt: number; // 마지막으로 받은 시각(ms) — 0이면 아직 못 받은 것이라 아무것도 그리지 않음
  isFetching: boolean;
  // 마지막으로 받은 뒤 이 시간 안에 누르면 요청하지 않고 아이콘만 돌림(연타로 서버에 요청이 쌓이지 않게)
  cooldownMs: number;
  onRefresh: () => void;
  onThrottled: () => void; // 쿨다운에 걸려 요청을 건너뛴 클릭 — 계측용
  ariaLabel: string;
}

// 섹션 제목행 오른쪽의 "3분 전 ↻" — 얼마나 최신 정보인지 보여주고, 눌러서 새로고침
export function RefreshStamp({ updatedAt, isFetching, cooldownMs, onRefresh, onThrottled, ariaLabel }: RefreshStampProps) {
  const [now, setNow] = useState(() => Date.now());
  const [isFakeSpinning, setIsFakeSpinning] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!isFakeSpinning) return;
    const id = setTimeout(() => setIsFakeSpinning(false), FAKE_SPIN_MS);
    return () => clearTimeout(id);
  }, [isFakeSpinning]);

  if (!updatedAt) return null;

  const handleClick = () => {
    if (isFetching || isFakeSpinning) return;
    // 쿨다운 안이면 "방금 전" 그대로가 사실이라, 요청 없이 반응만 줘도 사용자에게 틀린 정보가 아님
    if (Date.now() - updatedAt < cooldownMs) {
      setIsFakeSpinning(true);
      onThrottled();
      return;
    }
    onRefresh();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={ariaLabel}
      className="relative before:content-[''] before:absolute before:-inset-2 flex items-center gap-1 text-[13.5px] font-medium text-text-hint active:scale-95 transition-transform"
    >
      {/* 새로 받은 직후엔 now가 updatedAt보다 이전일 수 있어서(다음 틱 전) 음수 — 그대로 "방금 전"이 됨 */}
      <span>{formatUpdatedAgo(now - updatedAt)}</span>
      <RefreshCw size={15} strokeWidth={2.2} className={isFetching || isFakeSpinning ? 'animate-spin' : ''} />
    </button>
  );
}
