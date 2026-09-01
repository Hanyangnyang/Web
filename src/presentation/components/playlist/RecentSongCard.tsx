import { Play } from 'lucide-react';
import { type Song, GENRES } from './playlistTypes';

interface RecentSongCardProps {
  song: Song;
  onClick: () => void;
}

export function RecentSongCard({ song, onClick }: RecentSongCardProps) {
  // 장르마다 자기 이모지를 붙여서 " · "로 나열 (최대 3개)
  const genreDisplay = song.genres
    .map((label) => {
      const genre = GENRES.find((g) => g.label === label);
      return genre?.emoji ? `${genre.emoji}${label}` : label;
    })
    .join(' · ');

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick();
      }}
      aria-label="최근 추가된 곡 전체보기"
      className="flex-shrink-0 w-44 aspect-square rounded-xl overflow-hidden shadow-lg relative cursor-pointer"
    >
      {/* 앨범커버 전체 배경 */}
      <img
        src={song.albumArtUrl}
        alt={song.title}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* 가독성용 그라데이션 오버레이 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none" />

      {/* 재생 아이콘 — 우측 상단 코너. 하단은 텍스트로 붐비고, 중앙/좌상단은 앨범아트 인물·얼굴을
          가리기 쉬워서 대부분 비어있는 우상단에 고정 배치 */}
      <div className="absolute top-2 right-2 z-10 pointer-events-none">
        <Play size={24} className="ml-0.5" fill="white" stroke="white" strokeWidth={1} />
      </div>

      {/* 하단 정보 */}
      <div className="absolute bottom-0 inset-x-0 z-10 p-3 text-white">
        <div className="mb-1 truncate">
          <span className="text-sm font-bold">{song.title}</span>
          <span className="text-[10px] font-medium opacity-90 ml-1">{song.artist}</span>
        </div>
        {song.comment && <div className="text-[10px] truncate">"{song.comment}"</div>}

        <div className="border-t border-white/20 my-1" />

        <div className="flex items-center gap-1 text-[9px] font-medium opacity-90 ml-0.5">
          <span className="truncate">{genreDisplay}</span>
        </div>
      </div>
    </div>
  );
}
