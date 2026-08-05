import React from 'react';
import { BookOpen, Info } from 'lucide-react';
import type { LibraryStatus } from '../../../domain/repositories/IPortalRepository.js';

interface LibraryStatusCardProps {
  library: LibraryStatus | null;
  loading: boolean;
}

export function LibraryStatusCard({ library, loading }: LibraryStatusCardProps) {
  const totalEmptySeats = library?.list
    ? library.list.reduce((acc, r) => acc + Math.max(0, r.total - r.occupied), 0)
    : 0;

  const totalSeats = library?.list
    ? library.list.reduce((acc, r) => acc + r.total, 0)
    : 0;

  return (
    <section className="mb-6 mt-4">
      <div className="bg-white/90 backdrop-blur-xl border border-slate-200/90 rounded-2xl p-4 shadow-[0_8px_30px_-4px_rgba(15,23,42,0.06),0_2px_8px_-2px_rgba(15,23,42,0.04),0_0_0_1px_rgba(15,23,42,0.03)] select-none">
        {/* 헤더 섹션 */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0E4A84] flex-shrink-0">
              <BookOpen size={18} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-extrabold text-slate-800">학술정보관 열람실</h3>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
              <p className="text-[11px] font-semibold text-slate-400">실시간 좌석 혼잡도 현황</p>
            </div>
          </div>

          {/* 요약 잔여 좌석 뱃지 */}
          {!loading && library?.list && library.list.length > 0 && (
            <div className="bg-blue-50/80 border border-blue-200/60 px-3 py-1 rounded-full text-right flex-shrink-0">
              <span className="text-[10px] font-semibold text-slate-400 block leading-tight">전체 여유</span>
              <span className="text-xs font-black text-[#0E4A84] leading-tight">
                {totalEmptySeats}석 <span className="text-[10px] text-slate-400 font-normal">/ {totalSeats}석</span>
              </span>
            </div>
          )}
        </div>

        {/* 바디 섹션 */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-slate-50/70 border border-slate-200/60 rounded-xl p-3.5 animate-pulse flex flex-col gap-2.5">
                <div className="flex justify-between items-center">
                  <div className="h-4 w-32 bg-slate-200 rounded-full" />
                  <div className="h-4 w-12 bg-slate-200 rounded-full" />
                </div>
                <div className="h-2.5 w-full bg-slate-200 rounded-full" />
              </div>
            ))}
          </div>
        ) : library?.list && library.list.length > 0 ? (
          <div className="space-y-3">
            {library.list.map((room) => {
              const emptySeats = Math.max(0, room.total - room.occupied);
              const floorMatch = room.name.match(/\((.*?)\)/);
              const floor = floorMatch ? floorMatch[1] : null;
              const cleanName = room.name.replace(/\s*\([^)]*\)/, '');

              return (
                <div
                  key={room.id}
                  className="bg-slate-50/70 border border-slate-200/60 rounded-xl p-3.5 flex flex-col gap-2 transition-all duration-200 hover:border-slate-300"
                >
                  <div className="flex items-center justify-between min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-extrabold text-[0.92rem] text-slate-800 truncate">
                        {cleanName}
                      </span>
                      {floor && (
                        <span className="text-[10px] font-bold bg-white text-slate-500 border border-slate-200/80 px-1.5 py-0.5 rounded-md flex-shrink-0">
                          {floor}
                        </span>
                      )}
                    </div>

                    <div
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold flex-shrink-0"
                      style={{
                        backgroundColor: `${room.color}15`,
                        color: room.color,
                        border: `1px solid ${room.color}30`
                      }}
                    >
                      <span className="text-[10px]">{room.emoji}</span>
                      <span>{room.status}</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-baseline mb-1.5 text-xs">
                      <span className="font-bold text-slate-700">
                        <span className="text-[#0E4A84] font-black text-sm mr-0.5">{emptySeats}</span>석 남음
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400">
                        {room.occupied} / {room.total}석 ({(room.ratio * 100).toFixed(0)}%)
                      </span>
                    </div>

                    {/* 2026 프로그래스 바 */}
                    <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden p-0.5">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                        style={{
                          width: `${Math.min(100, Math.max(0, room.ratio * 100))}%`,
                          backgroundColor: room.color,
                          boxShadow: `0 0 8px ${room.color}60`
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-slate-50/70 border border-slate-200/60 rounded-xl py-8 flex flex-col items-center justify-center gap-2 text-center">
            <Info size={22} className="text-slate-400" />
            <p className="text-slate-500 text-sm font-semibold">
              현재 학술정보관 혼잡도 정보를 불러올 수 없습니다
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

