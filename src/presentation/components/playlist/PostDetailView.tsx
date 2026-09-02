import { MiscSubViewHeader } from '../misc/MiscSubViewHeader';
import { PostDetailCard, songToPostDetailCardData } from './PostDetailCard';
import { usePostDetail } from '../../hooks/useRecentSongs.js';
import { type Song } from './playlistTypes';
import { type TrackResult } from './SearchResultsView';

interface PostDetailViewProps {
  // 게시글 목록에서 눌러서 들어온 게시글 id — GET /api/v1/playlist/songs/{id}로 상세 조회
  postId: string;
  onBack: () => void;
  onPlay: (song: Song) => void;
  // 넘겨주면 카드의 곡명·가수명을 눌렀을 때 이 곡의 게시글 모음(TrackPostsView)으로 이동
  onSelectTrack?: (track: TrackResult) => void;
  // 지금 하단 플레이어에서 재생 중인 곡 — 이 게시글의 곡과 같으면 재생 버튼을 숨김
  currentTrackId?: string | null;
}

// 게시글 조회(단건) 화면 — 헤더는 항상 홈과 동일
export function PostDetailView({ postId, onBack, onPlay, onSelectTrack, currentTrackId }: PostDetailViewProps) {
  const { data: post, isLoading } = usePostDetail(postId);

  return (
    <div className="pb-[calc(var(--playlist-bottom-space,204px)+env(safe-area-inset-bottom))] transition-[padding-bottom] duration-300 ease-out">
      <MiscSubViewHeader
        title="에리카 플레이리스트"
        emoji="🕺"
        subtitle="에리카생들의 추천곡을 모아보고, 나도 추천해봐요!"
        onBack={onBack}
      />

      {isLoading || !post ? (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="w-full aspect-square skeleton-shimmer" />
          <div className="px-4 pt-3 pb-4">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-6 h-6 rounded-full skeleton-shimmer flex-shrink-0" />
              <div className="h-5 w-14 rounded-full skeleton-shimmer" />
            </div>
            <div className="h-4 w-1/2 rounded-full skeleton-shimmer mb-2" />
            <div className="h-3.5 w-full rounded-full skeleton-shimmer mb-1.5" />
            <div className="h-3.5 w-2/3 rounded-full skeleton-shimmer mb-3" />
            <div className="h-3 w-24 rounded-full skeleton-shimmer" />
          </div>
        </div>
      ) : (
        <PostDetailCard
          post={songToPostDetailCardData(post)}
          onPlay={() => onPlay(post)}
          isPlaying={post.trackId === currentTrackId}
          onSelectTrack={onSelectTrack}
        />
      )}
    </div>
  );
}
