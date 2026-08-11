import { Info } from 'lucide-react';
import type { LibraryStatus } from '../../../domain/repositories/ILibraryRepository.js';

interface LibraryStatusCardProps {
  library: LibraryStatus | null;
  loading: boolean;
}

export function LibraryStatusCard({ library, loading }: LibraryStatusCardProps) {
  return (
    <section className="mb-6">
      <h3 className="text-xl font-bold text-text-main mb-2">학정 혼잡도</h3>
      <div className="grid grid-cols-2 gap-3">
        {loading ? (
          [1, 2, 3, 4].map((i) => (
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
          ))
        ) : library?.list ? (
          library.list.map((room) => {
            return (
              <div key={room.id} className="bg-white rounded-card border border-slate-200 p-4 flex flex-col gap-3 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]">
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <span className="font-black text-[0.95rem] text-text-main leading-tight truncate flex-1 min-w-0">
                    {room.name.replace(' (2F)', '').replace(' (4F)', '')}
                  </span>
                  <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold flex-shrink-0" style={{
                    backgroundColor: `${room.color}15`,
                    color: room.color,
                    border: `1px solid ${room.color}25`
                  }}>
                    {room.emoji} {room.status}
                  </div>
                </div>

                <div className="mt-auto">
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                    <div className="h-full transition-all duration-700 cubic-bezier(0.34, 1.56, 0.64, 1)" style={{
                      width: `${room.ratio * 100}%`,
                      backgroundColor: room.color
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
          })
        ) : (
          <div className="col-span-2 bg-white rounded-card border border-slate-200 py-8 flex flex-col items-center gap-2 shadow-sm opacity-80">
            <Info size={20} className="text-text-hint" />
            <p className="text-center text-text-sub text-sm font-semibold">혼잡도 정보를 불러올 수 없습니다</p>
          </div>
        )}
      </div>
    </section>
  );
}
