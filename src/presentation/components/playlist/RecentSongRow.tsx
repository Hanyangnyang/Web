import { Play, Share2 } from 'lucide-react';
import { useState } from 'react';
import { type Song } from './playlistTypes';
import { SongShareModal } from './SongShareModal';

interface RecentSongRowProps {
  song: Song;
  onPlay: (song: Song) => void;
  onSelect: (song: Song) => void;
}

// 최근 추가된 곡 홈 미리보기 행 — ChartSongRow와 동일한 리스트 행 스타일(재생·공유 버튼 포함)이되 순위 숫자만 없음
export function RecentSongRow({ song, onPlay, onSelect }: RecentSongRowProps) {
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareCopiedToast, setShareCopiedToast] = useState(false);

  return (
    <div
      onClick={() => onSelect(song)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onSelect(song);
      }}
      role="button"
      tabIndex={0}
      aria-label={`${song.title} 전체보기`}
      className="flex items-center gap-3 px-3 py-2.5 border-b border-slate-200 hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer"
    >
      {/* 앨범 커버 */}
      <img
        src={song.albumArtUrl}
        alt={song.title}
        className="w-12 h-12 object-cover rounded flex-shrink-0 bg-slate-100"
      />

      {/* 곡정보 */}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-text-main truncate text-sm">{song.title}</div>
        <div className="text-xs text-text-sub truncate">{song.artist}</div>
      </div>

      {/* 재생 버튼 — row 전체 클릭(전체보기)과 별개 동작이라 전파를 막음 */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onPlay(song);
        }}
        aria-label={`${song.title} 재생`}
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
        aria-label={`${song.title} 공유하기`}
        className="w-6 flex items-center justify-center text-text-sub hover:scale-110 transition-transform active:scale-95 flex-shrink-0"
      >
        <Share2 size={16} strokeWidth={2} />
      </button>

      {shareModalOpen && (
        <SongShareModal
          song={{ title: song.title, artist: song.artist, albumArtUrl: song.albumArtUrl }}
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
