import { X } from 'lucide-react';
import { useMemo } from 'react';
import { useBackHandler } from '../../hooks/useBackHandler';
import { type Song } from './playlistTypes';
import { generateDummyPosts } from './playlistDummyData';
import { SongPostCard } from './SongPostCard';

interface SongPostsModalProps {
  song: Song;
  onClose: () => void;
}

// 화면 중앙에 뜨는 "이 곡을 추천한 게시글들" 캐러셀.
// 부모가 song이 있을 때만 이 컴포넌트를 마운트하는 방식(BottomSheet와 동일 컨벤션)이라 열려있는 동안만 뒤로가기를 가로챔
export function SongPostsModal({ song, onClose }: SongPostsModalProps) {
  useBackHandler(onClose);

  // 실제 연동 전까지는 열 때마다 더미 게시글을 생성 — trackId가 바뀔 때만 새로 만듦
  const posts = useMemo(() => generateDummyPosts(song), [song.trackId]);

  return (
    <div
      className="fixed inset-0 z-[1100] bg-black/45 backdrop-blur-[2px] flex flex-col items-center justify-center"
      style={{ animation: 'fadeIn 0.2s ease-out' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="mx-auto w-full max-w-app px-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="min-w-0 text-white">
            <div className="text-sm font-bold truncate">{song.title}</div>
            <div className="text-xs text-white/60 truncate">{song.artist} · 추천 게시글 {posts.length}개</div>
          </div>
          <button
            onClick={onClose}
            aria-label="닫기"
            className="flex-shrink-0 ml-2 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center active:scale-90 transition-transform"
          >
            <X size={16} className="text-white" />
          </button>
        </div>

        {/* 카드가 화면 양옆으로 살짝 삐져나오도록 좌우에 여백용 spacer를 둔 스냅 스크롤 캐러셀 */}
        <div
          className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-1 [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <div className="shrink-0 w-[10%]" aria-hidden="true" />
          {posts.map((post, index) => (
            <SongPostCard key={index} post={post} className="snap-center shrink-0 w-[72%] max-w-[264px]" />
          ))}
          <div className="shrink-0 w-[10%]" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
