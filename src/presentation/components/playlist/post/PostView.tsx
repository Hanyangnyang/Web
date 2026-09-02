import { MiscSubViewHeader } from '../../misc/MiscSubViewHeader';
import { PostDetailCard, songToPostDetailCardData } from '../shared/PostDetailCard';
import { PostDetailCardSkeleton } from '../shared/PostDetailCardSkeleton';
import { usePostDetail } from '../../../hooks/playlist/usePostDetail.js';
import { type Song, type TrackSummary } from '../playlistTypes';

interface PostViewProps {
  // 게시글 목록에서 눌러서 들어온 게시글 id — GET /api/v1/playlist/songs/{id}로 상세 조회
  postId: string;
  onBack: () => void;
  onPlay: (song: Song) => void;
  // 넘겨주면 카드의 곡명·가수명을 눌렀을 때 이 곡의 게시글 모음(TrackPostCollectionView)으로 이동
  onSelectTrack?: (track: TrackSummary) => void;
  // 지금 하단 플레이어에서 재생 중인 곡 — 이 게시글의 곡과 같으면 재생 버튼을 숨김
  currentTrackId?: string | null;
}

// 게시글 조회(단건) 화면
export function PostView({ postId, onBack, onPlay, onSelectTrack, currentTrackId }: PostViewProps) {
  const { data: post, isLoading } = usePostDetail(postId);

  return (
    <div className="pb-[calc(var(--playlist-bottom-space,204px)+env(safe-area-inset-bottom))] transition-[padding-bottom] duration-300 ease-out">
      <MiscSubViewHeader
        title="게시글"
        emoji="💬"
        subtitle={post ? `'${post.title} · ${post.artist}' 를 추천하는 글이에요!` : ''}
        onBack={onBack}
      />

      {isLoading || !post ? (
        <PostDetailCardSkeleton />
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
