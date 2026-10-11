import { MiscSubViewHeader } from '../../misc/MiscSubViewHeader';
import { PostDetailCard, songToPostDetailCardData } from '../shared/PostDetailCard';
import { PostDetailCardSkeleton } from '../shared/PostDetailCardSkeleton';
import { usePostDetail } from '../../../hooks/playlist/usePostDetail.js';
import { type Song, type TrackSummary } from '../playlistTypes';
import { EmptyMessageCard } from '../searchResults/EmptyMessageCard';
import { RecentSongsPreviewSection } from '../shared/RecentSongsPreviewSection';
import { type RecentSongsTapAreaVariant } from '../../../hooks/playlist/usePlaylistExperiment';

interface PostViewProps {
  // 게시글 목록에서 눌러서 들어온 게시글 id — GET /api/v1/playlist/songs/{id}로 상세 조회
  postId: string;
  onBack: () => void;
  onPlay: (track: TrackSummary) => void;
  // 넘겨주면 카드의 곡명·가수명을 눌렀을 때 이 곡의 게시글 모음(TrackPostCollectionView)으로 이동
  onSelectTrack?: (track: TrackSummary) => void;
  // 지금 하단 플레이어에서 재생 중인 곡 — 이 게시글의 곡과 같으면 재생 아이콘이 일시정지 아이콘으로 바뀜
  currentTrackId?: string | null;
  // 최근추가된곡 1열 카드와 같은 재생 버튼 동작을 쓰도록 같은 A/B 배정값을 넘김 — 안 넘기면 control
  playButtonVariant?: RecentSongsTapAreaVariant;
  // 하단 "최근 추가된 곡" 미리보기 — 검색 결과/추천글 모음 화면 하단과 같은 섹션
  onShowRecent: () => void;
  recentSongs: Song[];
  isRecentSongsLoading: boolean;
  onSelectRecentSong: (song: Song) => void;
}

// 게시글 조회(단건) 화면 — 카드는 최근추가된곡 1열과 같은 PostDetailCard라 모양·동작이 항상 일치함
export function PostView({ postId, onBack, onPlay, onSelectTrack, currentTrackId, playButtonVariant, onShowRecent, recentSongs, isRecentSongsLoading, onSelectRecentSong }: PostViewProps) {
  const { data: post, isLoading, isError, refetch, dataUpdatedAt } = usePostDetail(postId);

  return (
    <div className="pb-[calc(var(--playlist-bottom-space,204px)+env(safe-area-inset-bottom))] transition-[padding-bottom] duration-300 ease-out">
      <MiscSubViewHeader
        title="추천글"
        emoji="💬"
        subtitle={post ? `'${post.title} · ${post.artist}' 를 추천하는 글이에요!` : ''}
        onBack={onBack}
      />

      {isError && !post ? (
        // 삭제된 글의 공유 링크 등으로 단건 조회가 실패하면 스켈레톤만 계속 돌지 않게 안내
        <EmptyMessageCard message={'추천글을 불러오지 못했어요\n삭제되었거나 잠시 문제가 있을 수 있어요'} action={{ label: '다시 시도', onClick: () => void refetch() }} />
      ) : isLoading || !post ? (
        <PostDetailCardSkeleton />
      ) : (
        <PostDetailCard
          key={dataUpdatedAt} // 재조회로 새 값이 오면 카드의 반응/좋아요 로컬 state를 그 값으로 다시 시작
          post={songToPostDetailCardData(post)}
          onPlay={() => onPlay(post)}
          isPlaying={post.trackId === currentTrackId}
          onSelectTrack={onSelectTrack}
          playButtonVariant={playButtonVariant}
        />
      )}

      <hr className="-mx-3 my-4 border-slate-200" />

      <RecentSongsPreviewSection
        onShowRecent={onShowRecent}
        recentSongs={recentSongs}
        isLoading={isRecentSongsLoading}
        onSelectRecentSong={onSelectRecentSong}
        onPlay={onPlay}
        currentTrackId={currentTrackId}
        variant={playButtonVariant}
      />
    </div>
  );
}
