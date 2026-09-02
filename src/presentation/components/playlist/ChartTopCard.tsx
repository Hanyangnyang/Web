import { Play } from 'lucide-react';
import { type ChartTrack } from '../../../domain/entities/PopularityChart.js';

interface ChartTopCardProps {
  track: ChartTrack;
  // 이 곡에 달린 추천 게시글 목록(캐러셀)을 보여달라는 요청 — 북마크가 "곡"이 아니라 "게시글"에 귀속돼서
  // 여러 게시글이 있을 수 있는 곡 하나에 바로 붙일 수 없어 상세 보기로 유도
  onShowPosts: (track: ChartTrack) => void;
}

// 인기차트 홈 미리보기 카드(최대 10위) — RecentSongCard와 동일한 카드 스타일(앨범아트 전체 배경 +
// 우상단 재생 아이콘 + 하단 텍스트)에 거대 순위 숫자만 얹음
export function ChartTopCard({ track, onShowPosts }: ChartTopCardProps) {
  return (
    <div
      onClick={() => onShowPosts(track)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onShowPosts(track);
      }}
      aria-label={`${track.rank}위 ${track.title} 추천 게시글 보기`}
      className="flex-shrink-0 w-32 aspect-[27/50] rounded-xl overflow-hidden shadow-lg relative cursor-pointer"
    >
      {/* 앨범커버 전체 배경 */}
      <img
        src={track.albumArtUrl}
        alt={track.title}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* 가독성용 그라데이션 오버레이 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none" />

      {/* 재생 아이콘 — RecentSongCard와 동일하게 클릭 동작 없는 장식용, 우측 상단 코너 고정 */}
      <div className="absolute top-2 right-2 z-10 pointer-events-none">
        <Play size={24} className="ml-0.5" fill="white" stroke="white" strokeWidth={1} />
      </div>

      {/* 순위 + 곡정보 */}
      <div className="absolute bottom-0 inset-x-0 z-10 p-3 text-white">
        <div className="text-4xl font-black italic leading-none mb-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]">
          {track.rank}
        </div>
        <div className="truncate">
          <span className="text-sm font-bold">{track.title}</span>
        </div>
        <div className="text-[10px] font-medium opacity-90 truncate">{track.artist}</div>
      </div>
    </div>
  );
}
