import { Plus } from 'lucide-react';

interface EmptyChartStateProps {
  onShowAddSong: () => void;
  // '실시간'/'주간'/'월간' 등 지금 보고 있는 기간 칩의 라벨 — 아직 그 기간 차트가 집계되지 않았다는 문맥을 보여주는 데 씀
  periodLabel: string;
}

// 인기차트가 0개일 때 쓰는 안내 — 장르 필터 결과가 없는 것과는 다른 상황(집계 주기가 아직 안 돼서)이라 EmptyGenreState와 문구를 구분함
export function EmptyChartState({ onShowAddSong, periodLabel }: EmptyChartStateProps) {
  return (
    <button
      onClick={onShowAddSong}
      className="w-full flex flex-col items-center justify-center gap-1.5 py-10 px-4 text-center transition-colors hover:bg-slate-50 active:scale-[0.98]"
    >
      <span className="text-2xl">🔥</span>
      <p className="text-sm font-semibold text-text-main">아직 {periodLabel} 차트가 집계되지 않았어요</p>
      <span className="flex items-center gap-1 mt-1 px-3 py-1.5 rounded-full bg-[#2B3B52] text-white shadow-[0_4px_10px_rgba(43,59,82,0.3)] text-xs font-bold">
        <Plus size={14} strokeWidth={2.5} />
        첫 곡 추천하러 가기
      </span>
    </button>
  );
}
