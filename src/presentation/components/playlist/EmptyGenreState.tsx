import { Plus } from 'lucide-react';

interface EmptyGenreStateProps {
  onShowAddSong: () => void;
  // true면 최근추가된곡/좋아요누른곡 리스트 아이템(RecentSongListRow)과 같은 카드 박스 스타일로 표시
  boxed?: boolean;
}

// 장르 필터 결과가 0개일 때 공통으로 쓰는 안내 + 곡추천하기 유도 버튼
export function EmptyGenreState({ onShowAddSong, boxed = false }: EmptyGenreStateProps) {
  return (
    <button
      onClick={onShowAddSong}
      className={`w-full flex flex-col items-center justify-center gap-1.5 py-10 px-4 text-center transition-colors active:scale-[0.98] ${
        boxed
          ? 'bg-white rounded-xl border border-slate-200 shadow-[0_2px_4px_rgba(0,0,0,0.03)] hover:bg-slate-50'
          : 'hover:bg-slate-50'
      }`}
    >
      <span className="text-2xl">🎵</span>
      <p className="text-sm font-semibold text-text-main">아직 이 장르로 등록된 곡이 없어요</p>
      <span className="flex items-center gap-1 mt-1 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold">
        <Plus size={14} strokeWidth={2.5} />
        첫 곡 추천하러 가기
      </span>
    </button>
  );
}
