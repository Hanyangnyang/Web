import { Heart, MessageCircle, Play, Share2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { MiscSubViewHeader } from '../../misc/MiscSubViewHeader';
import { type ReactionKey } from '../postReactions';
import { type Song, type ReactionState, type TrackSummary, formatTimeAgo, toReactionState } from '../playlistTypes';
import { usePostInteractionMutations, nextOptimisticReaction } from '../../../hooks/playlist/usePostInteractions.js';
import { useTrackPosts, type TrackPostsSort } from '../../../hooks/playlist/useTrackPosts.js';
import { EmptyGenreState } from '../shared/EmptyGenreState';
import { CHIP_ACTIVE, CHIP_BASE, CHIP_INACTIVE } from '../shared/GenreFilterChips';
import { AlbumArtPlayButton } from '../shared/AlbumArtPlayButton';
import { EmojiReactionBar } from '../shared/EmojiReactionBar';
import { useSongReport } from '../shared/useSongReport';
import { ReportReasonPopup } from '../shared/ReportReasonPopup';
import { PostMoreMenu } from '../shared/PostMoreMenu';
import { useShareModal } from '../shared/useShareModal';
import { Toast } from '../shared/Toast';
import { useLikeToast } from '../shared/useLikeToast';
import { RecentSongsPreviewSection } from '../shared/RecentSongsPreviewSection';
import { type RecentSongsTapAreaVariant } from '../../../hooks/playlist/usePlaylistExperiment';

interface TrackPostCollectionViewProps {
  track: TrackSummary;
  onBack: () => void;
  onSelectPost: (post: Song) => void;
  onPlay: () => void;
  // 지금 이 곡이 하단 플레이어에서 재생 중인지 — true면 재생 아이콘이 일시정지 아이콘으로 바뀜
  isPlaying?: boolean;
  // 딥링크로 들어와 title 등이 비어 있던 곡 정보가 조회로 채워지면 부모에게 알려줌 — 부모(PlaylistView)의
  // 곡 추천하기 FAB이 이 화면에서 눌렸을 때 이 곡을 미리 채워서 곡추천하기 화면으로 보내려고 씀
  onResolveTrack: (track: TrackSummary) => void;
  // 화면 하단 "최근 추가된 곡" 섹션용
  onShowRecent: () => void;
  recentSongs: Song[];
  isRecentSongsLoading: boolean;
  onSelectRecentSong: (song: Song) => void;
  onPlayTrack: (track: TrackSummary) => void;
  currentTrackId?: string | null;
  recentSongsVariant?: RecentSongsTapAreaVariant;
}

const SORT_OPTIONS = [
  { key: 'latest', label: '최신' },
  { key: 'popular', label: '인기' },
] as const;

// 곡 단위 게시글 모음 화면 — 앨범커버 + 최신/인기 정렬 칩 + 게시글 리스트
export function TrackPostCollectionView({ track, onBack, onSelectPost, onPlay, isPlaying = false, onResolveTrack, onShowRecent, recentSongs, isRecentSongsLoading, onSelectRecentSong, onPlayTrack, currentTrackId, recentSongsVariant }: TrackPostCollectionViewProps) {
  const [sort, setSort] = useState<TrackPostsSort>('latest');
  const { data, isLoading } = useTrackPosts(track.trackId, sort);
  const posts = data?.posts ?? [];
  const totalCount = data?.totalSongsCount ?? posts.length;
  const totalPlayCount = data?.totalPlayCount ?? 0;
  // 딥링크(카카오 공유 등)로 trackId만 가지고 들어오면 track.title 등이 빈 문자열이라, useTrackPosts가
  // 받아온 값으로 채움 — 검색/차트 등에서 정상적으로 곡 정보를 들고 들어온 경우엔 이미 있는 track 값을 그대로 씀
  const displayTrack = {
    trackId: track.trackId,
    title: data?.title || track.title,
    artist: data?.artist || track.artist,
    albumArtUrl: data?.albumArtUrl || track.albumArtUrl,
  };
  const { trackId, title, artist, albumArtUrl } = displayTrack;
  useEffect(() => {
    onResolveTrack({ trackId, title, artist, albumArtUrl });
  }, [trackId, title, artist, albumArtUrl, onResolveTrack]);
  // 딥링크로 들어와서 아직 곡 정보를 하나도 못 받은 상태 — 이때만 곡 정보 카드에 스켈레톤을 보여줌
  const isTrackInfoLoading = isLoading && !track.title && !data;

  // 좋아요는 곡 단위라 이 화면의 모든 게시글이 같은 상태를 공유함 — 서버가 준 첫 게시글의 값으로 초기화
  const [liked, setLiked] = useState(false);
  const [reactionsByPost, setReactionsByPost] = useState<Record<string, ReactionState>>({});
  // 게시글 목록을 새로 받아올 때마다(정렬 변경 포함) 서버가 준 초기 좋아요/반응 상태로 로컬 상태를 다시 맞춤
  useEffect(() => {
    if (!data) return;
    const reactions: Record<string, ReactionState> = {};
    for (const post of data.posts) {
      if (!post.id) continue;
      reactions[post.id] = toReactionState(post.reactions);
    }
    setLiked(data.posts[0]?.isLiked ?? false);
    setReactionsByPost(reactions);
  }, [data]);

  const [openPickerPostId, setOpenPickerPostId] = useState<string | null>(null);
  const report = useSongReport();
  const likeToast = useLikeToast();
  const share = useShareModal(displayTrack);

  const { toggleLike, toggleReactionMutation } = usePostInteractionMutations();

  // 먼저 화면 상태를 낙관적으로 뒤집고, 응답이 오면 서버 값으로 맞추거나 실패 시 되돌림. 연타도 그대로 받아서 매번 뒤집음
  const handleToggleLike = () => {
    const optimistic = !liked;
    setLiked(optimistic);
    likeToast.show(optimistic);
    toggleLike.mutate(trackId, {
      onSuccess: (isLiked) => {
        setLiked(isLiked);
        if (isLiked !== optimistic) likeToast.show(isLiked); // 서버 상태가 예상과 다르면 실제 결과로 안내를 바로잡음
      },
      onError: () => {
        setLiked(!optimistic);
        likeToast.hide();
      },
    });
  };

  // 낙관적으로 카운트 증감 후, 서버가 내려준 그 곡의 반응 전체 최신 값으로 통째로 맞춤. 연타는 무시
  const handleToggleReaction = (postId: string, key: ReactionKey) => {
    if (toggleReactionMutation.isPending) return;
    const previous = reactionsByPost[postId] ?? {};
    setReactionsByPost((prev) => ({ ...prev, [postId]: nextOptimisticReaction(prev[postId] ?? {}, key) }));

    toggleReactionMutation.mutate(
      { songId: postId, reactionType: key },
      {
        onSuccess: (updatedReactions) =>
          setReactionsByPost((prev) => ({ ...prev, [postId]: toReactionState(updatedReactions) })),
        onError: () => setReactionsByPost((prev) => ({ ...prev, [postId]: previous })),
      }
    );
  };

  return (
    <div className="pb-[calc(var(--playlist-bottom-space,204px)+env(safe-area-inset-bottom))] transition-[padding-bottom] duration-300 ease-out">
      <MiscSubViewHeader
        title="게시글 모음"
        emoji="💬"
        subtitle={displayTrack.title ? `'${displayTrack.title} · ${displayTrack.artist}' 의 추천 게시글을 다 모았어요!` : ''}
        onBack={onBack}
      />

      {/* 곡 정보 — 앨범아트는 카드 폭의 40%(w-2/5)로 고정, 거기서 정사각형 높이를 역산해서 카드
          전체 높이를 결정함. 게시글 수/재생수는 칩이 아니라 아이콘+숫자로 담백하게 표기 */}
      {isTrackInfoLoading ? (
        <div className="flex items-stretch gap-3 mb-4 bg-white rounded-card border border-slate-200 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.03),0_8px_10px_-6px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="w-2/5 flex-shrink-0 aspect-square skeleton-shimmer" />
          <div className="min-w-0 flex-1 flex flex-col justify-center gap-1.5 py-2 pr-3">
            <div className="space-y-1.5">
              <div className="h-4 w-2/3 skeleton-shimmer rounded-full" />
              <div className="h-3 w-1/3 skeleton-shimmer rounded-full" />
            </div>
            <div className="border-t border-slate-300" />
            <div className="h-5 w-full skeleton-shimmer rounded-full" />
          </div>
        </div>
      ) : (
        <div className="flex items-stretch gap-3 mb-4 bg-white rounded-card border border-slate-200 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.03),0_8px_10px_-6px_rgba(0,0,0,0.03)] overflow-hidden">
          {/* 앨범커버 — 폭이 카드 전체 너비의 정확히 40%(반응형)가 되도록 w-2/5로 고정하고 aspect-square로
              그 폭에서 높이를 역산(카드 전체 높이도 이 앨범커버 높이를 따라감). 카드 왼쪽/위/아래 테두리에
              여백 없이 꽉 차게(overflow-hidden으로 왼쪽 모서리만 카드 라운딩에 맞춰 클립) */}
          <div className="relative w-2/5 flex-shrink-0 aspect-square">
            <img
              src={displayTrack.albumArtUrl}
              alt={displayTrack.title}
              className="w-full h-full object-cover bg-slate-100"
            />
            {/* 앨범커버 어디를 눌러도 재생/일시정지되도록 터치 영역을 커버 전체로 넓힘 — 아래 우상단 재생 아이콘·
                하트·공유 아이콘은 DOM 순서상 이 버튼 위에 쌓여서 각자의 동작을 그대로 유지함 */}
            <button
              onClick={onPlay}
              aria-label={isPlaying ? `${displayTrack.title} 일시정지` : `${displayTrack.title} 재생`}
              className="absolute inset-0 cursor-pointer"
            />
            {/* 재생 중엔 일시정지 아이콘으로 바뀌어서 그대로 눌러 멈출 수 있음 */}
            <AlbumArtPlayButton onPlay={onPlay} label={`${displayTrack.title} 재생`} isPlaying={isPlaying} variant="corner" />
            {/* 곡 좋아요(하트) — 곡 단위라 게시글 리스트가 아니라 앨범커버에 두고, 공유 아이콘(p-2 + 20px = 36px 폭) 왼쪽에 8px 간격으로 배치(터치 영역은 8px 겹침) */}
            <button
              onClick={handleToggleLike}
              aria-label="이 곡 좋아요"
              className="absolute bottom-0 right-7 p-2 active:scale-95 transition-transform"
            >
              <Heart
                size={20}
                stroke="white"
                fill={liked ? 'white' : 'none'}
                strokeWidth={2}
                className="drop-shadow-[0_1px_3px_rgba(0,0,0,0.45)]"
              />
            </button>
            {/* 곡 공유하기 — 앨범커버 오른쪽 하단에 우상단 재생 아이콘과 같은 흰색 아이콘 스타일로 배치(눌리는 영역은 p-2로 확보).
                곡 추천하기는 이 화면의 FAB(PlaylistView)이 이 곡을 미리 채워서 처리함 */}
            <button
              onClick={() => share.open()}
              aria-label="곡 공유하기"
              className="absolute bottom-0 right-0 p-2 active:scale-95 transition-transform"
            >
              <Share2 size={20} stroke="white" strokeWidth={2} className="drop-shadow-[0_1px_3px_rgba(0,0,0,0.45)]" />
            </button>
          </div>
          <div className="min-w-0 flex-1 flex flex-col justify-center gap-1.5 py-2 pr-3">
            <div className="leading-tight">
              <div className="text-lg font-bold text-text-main line-clamp-2 break-words">{displayTrack.title}</div>
              <div className="text-sm text-text-sub truncate">{displayTrack.artist}</div>
            </div>
            <div className="border-t border-slate-300" />
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-xs font-semibold text-text-sub">
                <MessageCircle size={12} className="flex-shrink-0" fill="currentColor" stroke="none" />
                {totalCount.toLocaleString()}개
              </span>
              <span className="flex items-center gap-1 text-xs font-semibold text-text-sub">
                <Play size={12} className="flex-shrink-0" fill="currentColor" stroke="none" />
                {totalPlayCount.toLocaleString()}회
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 정렬 칩 — 게시글 수는 위 곡 정보 카드로 옮김 */}
      {/* 장르 칩·기간 칩(ChartPeriodChips)과 같은 모양(CHIP_*) */}
      <div className="flex gap-1.5 mb-3">
        {SORT_OPTIONS.map((option) => (
          <button
            key={option.key}
            onClick={() => setSort(option.key)}
            aria-pressed={sort === option.key}
            className={`${CHIP_BASE} ${sort === option.key ? CHIP_ACTIVE : CHIP_INACTIVE}`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex flex-col gap-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-1.5 px-3.5 py-3 bg-white rounded-card border border-slate-200">
              <div className="h-4 w-full skeleton-shimmer rounded-full" />
              <div className="h-4 w-2/3 skeleton-shimmer rounded-full" />
              <div className="h-3 w-16 skeleton-shimmer rounded-full mt-1" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && posts.length === 0 && (
        <EmptyGenreState message="아직 이 곡을 추천한 게시글이 없어요" />
      )}

      {/* 게시글 리스트 — 카드 사이 간격을 둬서 항목마다 분리된 느낌 */}
      <div className="flex flex-col gap-1">
        {posts.map((post) => {
          const postId = post.id;
          const reactions = (postId ? reactionsByPost[postId] : undefined) ?? {};

          return (
            <div
              key={postId ?? post.trackId}
              role="button"
              tabIndex={0}
              onClick={() => onSelectPost(post)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onSelectPost(post);
              }}
              aria-label="게시글 상세 보기"
              className="flex flex-col gap-1.5 px-3.5 py-3 bg-white rounded-card border border-slate-200 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.03),0_8px_10px_-6px_rgba(0,0,0,0.03)] hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer"
            >
              {/* 본문 + 좋아요/더보기 */}
              <div className="flex items-start gap-2">
                {/* 한마디는 flex-1이 아니라 내용 폭만큼만 차지해서(길면 줄어들며 2줄 말줄임), 뱃지가 오른쪽 끝이 아니라 한마디 바로 옆에 붙음 */}
                <p className="min-w-0 text-sm text-text-main leading-snug line-clamp-2">
                  <span className="mr-[1px]">"</span>
                  {post.comment}
                  <span className="ml-[1px]">"</span>
                </p>

                {/* 내 글이면 한마디 바로 옆에 "내 추천" 뱃지(신고 더보기는 내 글에선 숨김) — 그림자 없는 연한 회색 알약 */}
                {post.isMine ? (
                  // h-5는 한마디 첫 줄(text-sm × leading-snug ≈ 19px)과 거의 같은 높이라 세로 중앙이 맞음
                  <span className="flex-shrink-0 h-5 px-2 flex items-center rounded-full bg-slate-100 border border-slate-200 text-slate-500 text-[10px] font-semibold leading-none">
                    내 추천
                  </span>
                ) : (
                  <div className="flex items-start gap-3 flex-shrink-0 ml-auto">
                    <PostMoreMenu report={report} menuKey={postId ?? ''} reportTargetId={postId} />
                  </div>
                )}
              </div>

              {/* 시간 + 이모지 반응 — 카드 전체 너비를 다 활용. 시간은 ml-auto로 항상 맨 오른쪽 끝에 고정 */}
              <div className="flex items-center gap-1.5">
                <EmojiReactionBar
                  reactions={reactions}
                  onToggleReaction={(key) => {
                    if (postId) handleToggleReaction(postId, key);
                  }}
                  disabled={toggleReactionMutation.isPending}
                  pickerOpen={openPickerPostId === postId}
                  onTogglePicker={() => setOpenPickerPostId((prev) => (prev === postId ? null : postId ?? null))}
                  size="compact"
                  className="flex-1 min-w-0"
                />

                <span className="flex-shrink-0 text-xs text-text-hint ml-auto">{formatTimeAgo(post.createdAt)}</span>
              </div>
            </div>
          );
        })}
      </div>

      <hr className="-mx-3 my-4 border-slate-200" />

      <RecentSongsPreviewSection
        onShowRecent={onShowRecent}
        recentSongs={recentSongs}
        isLoading={isRecentSongsLoading}
        onSelectRecentSong={onSelectRecentSong}
        onPlay={onPlayTrack}
        currentTrackId={currentTrackId}
        variant={recentSongsVariant}
      />

      {/* 신고 사유 선택 팝업 */}
      {report.reportTargetId && (
        <ReportReasonPopup
          selectedReason={report.selectedReason}
          onSelectReason={report.setSelectedReason}
          onCancel={report.closeReasonPopup}
          onConfirm={report.confirmReport}
          isPending={report.isPending}
          isError={report.isError}
        />
      )}

      {/* 신고 접수 완료 토스트 */}
      {report.toast && <Toast message={report.toast} />}
      {likeToast.node}

      {share.node}
    </div>
  );
}
