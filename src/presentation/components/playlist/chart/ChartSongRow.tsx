import { Pause, Play, Share2 } from 'lucide-react';
import { type ChartTrack } from '../../../../domain/entities/PopularityChart.js';
import { useShareModal } from '../shared/useShareModal';

interface ChartSongRowProps {
  track: ChartTrack;
  onPlay: (track: ChartTrack) => void;
  // 이 곡에 달린 추천 게시글 목록(캐러셀)을 보여달라는 요청 — 북마크가 "곡"이 아니라 "게시글"에 귀속돼서
  // 여러 게시글이 있을 수 있는 곡 하나에 바로 붙일 수 없어 상세 보기로 유도
  onShowPosts: (track: ChartTrack) => void;
  // 지금 하단 플레이어에서 재생 중인 곡 — 같으면 재생 아이콘이 일시정지 아이콘으로 바뀜
  currentTrackId?: string | null;
  // 순위 숫자 타이포그래피 — 기본은 인기차트 전체보기(ChartView)의 담백한 스타일. 소식탭 홍보 카드처럼
  // 강조하고 싶은 곳에서만 예) "font-black text-base text-gray-900 italic -skew-x-6"로 덮어쓴다
  rankClassName?: string;
  // 앨범 커버 크기 — 기본은 ChartView 목록의 48px(w-12 h-12). 소식탭 홍보 카드처럼 더 크게 보이고
  // 싶은 곳에서만 예) "w-14 h-14"로 덮어쓴다
  thumbnailClassName?: string;
}

export function ChartSongRow({
  track,
  onPlay,
  onShowPosts,
  currentTrackId,
  rankClassName = 'font-bold text-sm text-gray-900',
  thumbnailClassName = 'w-12 h-12',
}: ChartSongRowProps) {
  const isPlaying = track.trackId === currentTrackId;
  const share = useShareModal({ trackId: track.trackId, title: track.title, artist: track.artist, albumArtUrl: track.albumArtUrl });

  return (
    <div
      onClick={() => onShowPosts(track)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onShowPosts(track);
      }}
      role="button"
      tabIndex={0}
      aria-label={`${track.title} 추천 게시글 보기`}
      className="flex items-center gap-3 px-3 py-2.5 border-b border-slate-200 hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer"
    >
      {/* 순위 */}
      <span className={`${rankClassName} w-7 text-center flex-shrink-0`}>
        {track.rank}
      </span>

      {/* 앨범 커버 */}
      {track.albumArtUrl && (
        <img
          src={track.albumArtUrl}
          alt={track.title}
          className={`${thumbnailClassName} object-cover rounded flex-shrink-0`}
        />
      )}

      {/* 곡정보 */}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-text-main truncate text-sm">{track.title}</div>
        <div className="text-xs text-text-sub truncate">{track.artist}</div>
      </div>

      {/* 재생 버튼 — row 전체 클릭(게시글 보기)과 별개 동작이라 전파를 막음 */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onPlay(track);
        }}
        aria-label={isPlaying ? `${track.title} 일시정지` : `${track.title} 재생`}
        className="w-9 h-9 flex items-center justify-center text-text-sub hover:scale-110 transition-transform active:scale-95 flex-shrink-0"
      >
        {isPlaying ? (
          <Pause size={18} fill="none" stroke="currentColor" strokeWidth={2} />
        ) : (
          <Play size={18} fill="none" stroke="currentColor" strokeWidth={2} />
        )}
      </button>

      {/* 공유 버튼 — 재생 버튼과 같은 자리, row 클릭과 별개 동작이라 전파를 막음 */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          share.open();
        }}
        aria-label={`${track.title} 공유하기`}
        className="w-9 h-9 flex items-center justify-center text-text-sub hover:scale-110 transition-transform active:scale-95 flex-shrink-0"
      >
        <Share2 size={16} strokeWidth={2} />
      </button>

      {share.node}
    </div>
  );
}
