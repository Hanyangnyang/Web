import { BookOpen, Info } from 'lucide-react';
import type { LibraryStatus } from '../../../domain/repositories/IPortalRepository.js';

interface LibraryStatusCardProps {
  library: LibraryStatus | null;
  loading: boolean;
}

export function LibraryStatusCard({ library, loading }: LibraryStatusCardProps) {
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
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-slate-400">실시간 좌석</span>
        </div>

        {/* 2x2 프레임리스 십자 분할 현황판 (외곽 테두리 상자 없이 순수 십자 구분선만 배치) */}
        {loading ? (
          <div className="grid grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-2.5 animate-pulse flex flex-col gap-2">
                <div className="h-3 w-16 bg-slate-200 rounded-full" />
                <div className="h-5 w-20 bg-slate-200 rounded-md" />
              </div>
            ))}
          </div>
        ) : library?.list && library.list.length > 0 ? (
          <div className="grid grid-cols-2">
            {library.list.map((room, idx) => {
              const emptySeats = Math.max(0, room.total - room.occupied);
              const floorMatch = room.name.match(/\((.*?)\)/);
              const floor = floorMatch ? floorMatch[1] : null;
              const cleanName = room.name.replace(/\s*\([^)]*\)/, '');

              // 십자 구분선 및 4개 구역 패딩 (외곽 테두리 박스 완전 제거)
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
                    <span className="flex items-center gap-1 text-[10px] font-bold flex-shrink-0" style={{ color: room.color }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: room.color }} />
                      {room.status}
                    </span>
                  </div>

                  {/* 라인 2: 대형 핵심 수치 메트릭 */}
                  <div className="flex items-baseline gap-1 my-0.5">
                    <span className="text-base font-black text-[#0E4A84] leading-none">
                      {emptySeats}
                    </span>
                    <span className="text-[11px] font-bold text-slate-600">석 남음</span>
                    <span className="text-[9.5px] font-semibold text-slate-400 ml-auto">
                      {room.occupied}/{room.total}
                    </span>
                  </div>

                  {/* 라인 3: 슬림 프로그래스 바 */}
                  <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: `${Math.min(100, Math.max(0, room.ratio * 100))}%`,
                        backgroundColor: room.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-6 flex flex-col items-center justify-center gap-1.5 text-center">
            <Info size={18} className="text-slate-400" />
            <p className="text-slate-500 text-xs font-semibold">
              현재 열람실 혼잡도 정보를 불러올 수 없습니다
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
