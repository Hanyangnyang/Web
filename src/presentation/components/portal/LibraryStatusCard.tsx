import { Info, WifiOff } from 'lucide-react';
import type { LibraryStatus } from '../../../domain/repositories/ILibraryRepository.js';
import type { LibraryRoomStatus } from '../../../domain/entities/LibraryRoom.js';
import { formatKSTHourMinute } from '../../../utils/time.js';

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
}

function Section({ updatedAtLabel, children }: { updatedAtLabel?: string | null; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-baseline justify-between gap-2 mb-2">
        <h3 className="text-xl font-bold text-text-main">학정 혼잡도</h3>
        {updatedAtLabel && (
          <span className="text-[11px] font-semibold text-text-hint flex-shrink-0">
            {updatedAtLabel} 기준
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">{children}</div>
    </section>
  );
}

function Notice({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div className="col-span-2 bg-white rounded-card border border-slate-200 py-8 flex flex-col items-center gap-2 shadow-sm opacity-80">
      {icon}
      <p className="text-center text-text-sub text-sm font-semibold">{message}</p>
    </div>
  );
}

export function LibraryStatusCard({ library, loading, error }: LibraryStatusCardProps) {
  // 1. 로딩중 — 스켈레톤
  if (loading) {
    return (
      <Section>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-card border border-slate-200 p-4 flex flex-col gap-3 animate-pulse">
            <div className="flex items-center justify-between gap-2">
              <div className="h-4 w-2/3 bg-slate-100 rounded-full" />
              <div className="h-4 w-10 bg-slate-100 rounded-md flex-shrink-0" />
            </div>
            <div className="mt-auto">
              <div className="w-full h-2 bg-slate-100 rounded-full" />
              <div className="flex justify-between items-center mt-2.5">
                <div className="h-3 w-16 bg-slate-100 rounded-full" />
                <div className="h-3 w-12 bg-slate-100 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </Section>
    );
  }

  // 2. 실패 — 캐시된 이전 데이터도 없을 때만. 있으면 그걸 계속 보여준다(아래 4번).
  if (error && !library) {
    return <Section><Notice icon={<WifiOff size={20} className="text-text-hint" />} message="혼잡도 정보를 불러오지 못했습니다" /></Section>;
  }

  // 3. 성공했지만 비어있음 — 방학 중 휴관 등. 빈 배열은 truthy라 length로 판단해야 한다.
  if (!library?.list.length) {
    return <Section><Notice icon={<Info size={20} className="text-text-hint" />} message="지금은 운영 중인 열람실이 없습니다" /></Section>;
  }

  // 4. 정상
  return (
    <Section updatedAtLabel={formatKSTHourMinute(library.updatedAt)}>
      {library.list.map((room) => {
        const { color, emoji } = STATUS_STYLE[room.status];
        return (
          <div key={room.id} className="bg-white rounded-card border border-slate-200 p-4 flex flex-col gap-3 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between gap-2 min-w-0">
              <span className="font-black text-[0.95rem] text-text-main leading-tight truncate flex-1 min-w-0">
                {room.name.replace(' (2F)', '').replace(' (4F)', '')}
              </span>
              <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold flex-shrink-0" style={{
                backgroundColor: `${color}15`,
                color,
                border: `1px solid ${color}25`
              }}>
                {emoji} {room.status}
              </div>
            </div>

            <div className="mt-auto">
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                <div className="h-full" style={{
                  width: `${room.ratio * 100}%`,
                  backgroundColor: color
                }} />
              </div>
              <div className="flex justify-between items-center mt-2.5">
                <span className="text-[12px] text-slate-700 font-black">
                  {room.available}석 남음
                </span>
                <span className="text-[11px] text-[#475569] font-bold">
                  {room.occupied} / {room.total}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </Section>
  );
}
