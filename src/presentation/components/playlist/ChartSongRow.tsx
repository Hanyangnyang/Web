import { Play, Share2 } from 'lucide-react';
import { useState } from 'react';
import { type ChartTrack } from '../../../domain/entities/PopularityChart.js';
import { SongShareModal } from './SongShareModal';

interface ChartSongRowProps {
  track: ChartTrack;
  onPlay: (track: ChartTrack) => void;
  // 이 곡에 달린 추천 게시글 목록(캐러셀)을 보여달라는 요청 — 북마크가 "곡"이 아니라 "게시글"에 귀속돼서
  // 여러 게시글이 있을 수 있는 곡 하나에 바로 붙일 수 없어 상세 보기로 유도
  onShowPosts: (track: ChartTrack) => void;
}

export function ChartSongRow({ track, onPlay, onShowPosts }: ChartSongRowProps) {
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareCopiedToast, setShareCopiedToast] = useState(false);

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
      <span className="font-bold text-sm text-gray-900 w-7 text-center flex-shrink-0">
        {track.rank}
      </span>

      {/* 앨범 커버 */}
      {track.albumArtUrl && (
        <img
          src={track.albumArtUrl}
          alt={track.title}
          className="w-12 h-12 object-cover rounded flex-shrink-0"
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
        aria-label={`${track.title} 재생`}
        className="w-6 flex items-center justify-center text-black hover:scale-110 transition-transform active:scale-95 flex-shrink-0"
      >
        <Play size={18} fill="none" stroke="currentColor" strokeWidth={2} />
      </button>

      {/* 공유 버튼 — 재생 버튼과 같은 자리, row 클릭과 별개 동작이라 전파를 막음 */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShareModalOpen(true);
        }}
        aria-label={`${track.title} 공유하기`}
        className="w-6 flex items-center justify-center text-text-sub hover:scale-110 transition-transform active:scale-95 flex-shrink-0"
      >
        <Share2 size={16} strokeWidth={2} />
      </button>

      {shareModalOpen && (
        <SongShareModal
          song={{ trackId: track.trackId, title: track.title, artist: track.artist, albumArtUrl: track.albumArtUrl }}
          onClose={() => setShareModalOpen(false)}
          onCopied={() => {
            setShareCopiedToast(true);
            setTimeout(() => setShareCopiedToast(false), 1800);
          }}
        />
      )}

      {shareCopiedToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-[rgba(15,23,42,0.85)] text-white text-[0.78rem] font-medium px-4 py-2 rounded-full z-[200] whitespace-pre-line text-center copy-toast">
          링크 복사됨!
        </div>
      )}
    </div>
  );
}
