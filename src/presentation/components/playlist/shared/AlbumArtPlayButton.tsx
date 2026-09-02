import { Play } from 'lucide-react';

interface AlbumArtPlayButtonProps {
  onPlay: () => void;
  label: string;
  // 카드 크기에 따라 버튼 비율을 다르게 쓰는 화면(예: 2열 요약 카드)이 있어 오버라이드 가능
  sizeClass?: string;
  // 앨범커버가 클릭 가능한 카드 안에 있을 때, 버튼 클릭이 카드 자체의 onClick으로 전파되지 않게 막을지
  stopPropagation?: boolean;
}

// 앨범커버 위에 얹는 반투명 원형 재생 버튼 — 검색결과/최근추가된곡/곡추천하기/게시글 모음 등
// 앨범커버가 나오는 모든 화면이 공유하는 스타일
export function AlbumArtPlayButton({ onPlay, label, sizeClass = 'w-[22%]', stopPropagation = true }: AlbumArtPlayButtonProps) {
  return (
    <button
      onClick={(e) => {
        if (stopPropagation) e.stopPropagation();
        onPlay();
      }}
      aria-label={label}
      className={`absolute inset-0 m-auto ${sizeClass} aspect-square rounded-full bg-white/30 backdrop-blur-md border border-white/40 shadow-md flex items-center justify-center active:scale-95 transition-transform`}
    >
      <Play className="w-1/2 h-1/2 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.45)]" fill="white" stroke="white" strokeWidth={1} />
    </button>
  );
}
