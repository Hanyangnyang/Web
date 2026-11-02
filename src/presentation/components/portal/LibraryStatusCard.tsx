import { useEffect, useState, type ReactNode } from 'react';
import { BookOpen, ChevronRight, Info } from 'lucide-react';
import type { LibraryStatus } from '../../../domain/repositories/ILibraryRepository.js';
import type { LibraryRoomStatus } from '../../../domain/entities/LibraryRoom.js';

const STATUS_STYLE: Record<LibraryRoomStatus, { color: string; emoji: string }> = {
  '쾌적': { color: '#2563eb', emoji: '🔵' },
  '보통': { color: '#22c55e', emoji: '🟢' },
  '혼잡': { color: '#ef4444', emoji: '🔴' },
  '매우 혼잡': { color: '#991b1b', emoji: '😫' },
};

interface LibraryStatusCardProps {
  library: LibraryStatus | null;
  loading: boolean;
  error?: Error | null;
  onRetry?: () => void;
  showOpenSpaceHint?: boolean;
  onFindOpenSpace?: () => void;
}

// 카드 자체가 이미 테두리·배경을 갖고 있어서, 실패/빈 상태도 CardFallback으로 한 번 더
// 감싸지 않고 십자분할 그리드가 있을 자리를 그대로 대체한다 (이중 테두리 방지)
function InlineNotice({ icon, message, onRetry }: { icon: ReactNode; message: string; onRetry?: () => void }) {
  return (
    <div className="py-6 flex flex-col items-center justify-center gap-1.5 text-center">
      {icon}
      <p className="text-slate-500 text-xs font-semibold">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-1 bg-primary/90 text-white text-[11px] font-bold px-3 py-1.5 rounded-full active:scale-95 transition-transform shadow-[0_4px_12px_rgba(14,74,132,0.2)]"
        >
          다시 시도
        </button>
      )}
    </div>
  );
}


const OPEN_SPACE_HINT = "학정 말고 📚오픈스페이스는 어때요?";
// 한 글자씩 타이핑하기 위한 글자 배열. Array.from은 코드포인트 단위로 잘라서 이모지가 반쪽(서로게이트)으로 쪼개지지 않는다
const HINT_CHARS = Array.from(OPEN_SPACE_HINT);
// 강조할 구간 — 이모지는 문자열 길이로 2칸이라 indexOf 결과를 그대로 쓰면 어긋난다. 글자 배열 기준 인덱스로 바꿔 둔다
const HINT_BOLD = '오픈스페이스';
const HINT_BOLD_START = Array.from(OPEN_SPACE_HINT.slice(0, OPEN_SPACE_HINT.indexOf(HINT_BOLD))).length;
const HINT_BOLD_END = HINT_BOLD_START + Array.from(HINT_BOLD).length;
const HINT_OPEN_DELAY_MS = 600;   // 카드가 그려지고 잠깐 뒤에 펼친다 (처음부터 열려 있으면 "생겨나는" 느낌이 없다)
const HINT_EXPAND_MS = 500;       // 펼침 애니메이션 길이 — 다 벌어진 뒤에 타이핑을 시작한다 (아래 duration-500과 같이 움직여야 한다)
const HINT_TYPE_INTERVAL_MS = 80; // 글자 간격 (21자 ≈ 1.7초)

// 좌석 그리드 아래가 벌어지며 안내 문구가 한 글자씩 타이핑된다. 다 쳐지면 '찾아보기'가 나타난다.
// 높이는 grid-rows 0fr → 1fr 전환으로 애니메이션한다 — 내용 높이를 몰라도 height: auto까지 부드럽게 열린다.
function OpenSpaceHint({ show, onClick }: { show: boolean; onClick?: () => void }) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState(0);

  useEffect(() => {
    if (!show) {
      setOpen(false);
      setTyped(0);
      return;
    }
    // 움직임 줄이기 설정이면 애니메이션 없이 문구 전체를 바로 보여준다
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setOpen(true);
      setTyped(HINT_CHARS.length);
      return; 
    }
    const t = setTimeout(() => setOpen(true), HINT_OPEN_DELAY_MS);
    return () => clearTimeout(t);
  }, [show]);

  useEffect(() => {
    if (!open || typed >= HINT_CHARS.length) return;
    const t = setTimeout(() => setTyped((n) => n + 1), typed === 0 ? HINT_EXPAND_MS : HINT_TYPE_INTERVAL_MS);
    return () => clearTimeout(t);
  }, [open, typed]);

  const done = typed >= HINT_CHARS.length;

  return (
    <div className={`grid transition-[grid-template-rows] duration-500 ease-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
      <div className="overflow-hidden">
        <div className="pt-2.5">
          <button
            onClick={onClick}
            disabled={!open}
            aria-label={OPEN_SPACE_HINT}
            // 배경·테두리 없이 내용만 — 좌우 여백도 빼서 헤더·좌석 그리드와 왼쪽 끝을 맞춘다.
            // 위 구분선은 헤더·그리드 구분선과 같은 색으로 그어 좌석 그리드와 나눈다 (아래는 카드 안쪽 여백이 있어 조금만 준다)
            className="w-full flex items-center justify-between gap-2 pt-2.5 border-t border-slate-100 text-left active:opacity-60 transition-opacity [-webkit-tap-highlight-color:transparent]"
          >
            <span className="flex items-center min-w-0" aria-hidden>
              {/* 좌석 정보가 주인공이라 문구는 한 단계 연하게 (헤더의 '실시간 좌석'과 좌석 이름 사이 톤) */}
              <span className="text-[12.5px] font-semibold text-slate-500 leading-snug">
                {/* 타이핑 중에도 강조 구간에 들어선 글자부터 굵게 나오도록, 지금까지 친 글자를 구간별로 나눠 그린다 */}
                {HINT_CHARS.slice(0, Math.min(typed, HINT_BOLD_START)).join('')}
                <strong className="font-extrabold text-slate-600">
                  {HINT_CHARS.slice(HINT_BOLD_START, Math.min(typed, HINT_BOLD_END)).join('')}
                </strong>
                {HINT_CHARS.slice(HINT_BOLD_END, typed).join('')}
                {/* 타이핑 중 커서 */}
                {open && !done && <span className="inline-block w-px h-[1em] align-[-2px] ml-px bg-slate-400 animate-pulse" />}
              </span>
            </span>
            <span
              aria-hidden
              className={`flex-shrink-0 flex items-center text-[11px] font-bold text-primary/70 transition-opacity duration-300 ${done ? 'opacity-100' : 'opacity-0'}`}
            >
              찾아보기
              <ChevronRight size={13} strokeWidth={2.6} />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function LibraryStatusCard({ library, loading, error, onRetry, showOpenSpaceHint = false, onFindOpenSpace }: LibraryStatusCardProps) {
  // 좌석이 실제로 그려지는 정상 상태에서만 (로딩·실패·휴관 중엔 "혼잡"이 성립하지 않는다)
  const hintVisible = showOpenSpaceHint && !!onFindOpenSpace && !loading && !!library?.list.length;

  return (
    <section className="mb-5 mt-3">
      <div className="bg-white/90 backdrop-blur-xl border border-slate-200/90 rounded-2xl p-4 shadow-[0_8px_30px_-4px_rgba(15,23,42,0.06),0_2px_8px_-2px_rgba(15,23,42,0.04),0_0_0_1px_rgba(15,23,42,0.03)] select-none">
        {/* 헤더 */}
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-blue-50 border border-blue-100/80 flex items-center justify-center text-[#0E4A84] flex-shrink-0">
              <BookOpen size={14} />
            </div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-[0.88rem] font-extrabold text-slate-800">학술정보관 열람실</h3>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-slate-400">실시간 좌석</span>
        </div>

        {/* 1. 로딩 중 — 스켈레톤 */}
        {loading ? (
          <div className="grid grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-2.5 animate-pulse flex flex-col gap-2">
                <div className="h-3 w-16 bg-slate-200 rounded-full" />
                <div className="h-5 w-20 bg-slate-200 rounded-md" />
              </div>
            ))}
          </div>
        ) : error && !library ? (
          // 2. 실패 — 캐시된 이전 데이터도 없을 때만. 있으면 그걸 계속 보여준다(아래 4번).
          <InlineNotice icon={<Info size={18} className="text-slate-400" />} message="혼잡도 정보를 불러오지 못했습니다" onRetry={onRetry} />
        ) : !library?.list.length ? (
          // 3. 성공했지만 비어있음 — 방학 중 휴관 등. 추후 이슈 121 해결되면 사용하게될 분기.
          <InlineNotice icon={<Info size={18} className="text-slate-400" />} message="지금은 운영 중인 열람실이 없습니다" />
        ) : (
          // 4. 정상 — 2x2 프레임리스 십자 분할 현황판 (외곽 테두리 상자 없이 순수 십자 구분선만 배치)
          <div className="grid grid-cols-2">
            {library.list.map((room, idx) => {
              const { color } = STATUS_STYLE[room.status];
              const floorMatch = room.name.match(/\((.*?)\)/);
              const floor = floorMatch ? floorMatch[1] : null;
              const cleanName = room.name.replace(/\s*\([^)]*\)/, '');

              const isRight = idx % 2 === 1;
              const isBottom = idx >= 2;
              const borderClass = `${!isRight ? 'border-r border-slate-100' : ''} ${!isBottom ? 'border-b border-slate-100' : ''}`;
              const paddingClass = `${!isRight ? 'pr-3' : 'pl-3'} ${!isBottom ? 'pb-2.5' : 'pt-2.5'}`;

              return (
                <div key={room.id} className={`flex flex-col justify-between gap-1.5 ${borderClass} ${paddingClass}`}>
                  {/* 라인 1: 이름 & 층수 & 상태점 */}
                  <div className="flex items-center justify-between min-w-0">
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="font-extrabold text-[0.8rem] text-slate-800 truncate">
                        {cleanName}
                      </span>
                      {floor && (
                        <span className="text-[9px] font-semibold text-slate-400 bg-slate-100 px-1 py-0.2 rounded flex-shrink-0">
                          {floor}
                        </span>
                      )}
                    </div>
                    <span className="flex items-center gap-1 text-[10px] font-bold flex-shrink-0" style={{ color }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                      {room.status}
                    </span>
                  </div>

                  {/* 라인 2: 대형 핵심 수치 메트릭 */}
                  <div className="flex items-baseline gap-1 my-0.5">
                    <span className="text-base font-black text-[#0E4A84] leading-none">
                      {room.available}
                    </span>
                    <span className="text-[11px] font-bold text-slate-600">석 남음</span>
                    <span className="text-[9.5px] font-semibold text-slate-400 ml-auto">
                      {room.occupied}/{room.total}
                    </span>
                  </div>

                  {/* 라인 3: 슬림 프로그레스 바 */}
                  <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: `${Math.min(100, Math.max(0, room.ratio * 100))}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <OpenSpaceHint show={hintVisible} onClick={onFindOpenSpace} />
      </div>
    </section>
  );
}
