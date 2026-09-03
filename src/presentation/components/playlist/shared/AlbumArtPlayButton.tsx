import { Pause, Play } from 'lucide-react';

interface AlbumArtPlayButtonProps {
  onPlay: () => void;
  label: string;
  // true면 이 트랙이 지금 재생 중 — 재생 삼각형 대신 일시정지 아이콘을 보여주고, 눌렀을 때 멈추는 동작으로 안내
  isPlaying?: boolean;
  // 카드 크기에 따라 버튼 비율을 다르게 쓰는 화면(예: 2열 요약 카드)이 있어 오버라이드 가능
  sizeClass?: string;
  // 앨범커버가 클릭 가능한 카드 안에 있을 때, 버튼 클릭이 카드 자체의 onClick으로 전파되지 않게 막을지
  stopPropagation?: boolean;
}

// 앨범커버 위에 얹는 반투명 원형 재생/일시정지 버튼 — 검색결과/최근추가된곡/곡추천하기/게시글 모음 등
// 앨범커버가 나오는 모든 화면이 공유하는 스타일. 항상 렌더링되고(재생 중이라고 숨지 않음) 아이콘만 토글됨
export function AlbumArtPlayButton({ onPlay, label, isPlaying = false, sizeClass = 'w-[22%]', stopPropagation = true }: AlbumArtPlayButtonProps) {
  return (
    <button
      onClick={(e) => {
        if (stopPropagation) e.stopPropagation();
        onPlay();
      }}
      aria-label={label}
      className={`absolute inset-0 m-auto ${sizeClass} aspect-square rounded-full bg-white/30 backdrop-blur-md border border-white/40 shadow-md flex items-center justify-center active:scale-95 transition-transform`}
    >
      {isPlaying ? (
        <Pause className="w-1/2 h-1/2 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.45)]" fill="white" stroke="white" strokeWidth={1} />
      ) : (
        <Play className="w-1/2 h-1/2 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.45)]" fill="white" stroke="white" strokeWidth={1} />
      )}
    </button>
  );
}
