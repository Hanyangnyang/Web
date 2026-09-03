import { Heart, MoreVertical, Music, Play, Share2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { MiscSubViewHeader } from '../../misc/MiscSubViewHeader';
import { type ReactionKey } from '../postReactions';
import { type Song, type ReactionState, type TrackSummary, formatTimeAgo, toReactionState } from '../playlistTypes';
import { useToggleBookmark } from '../../../hooks/playlist/useToggleBookmark.js';
import { useToggleReaction } from '../../../hooks/playlist/useToggleReaction.js';
import { useTrackPosts, type TrackPostsSort } from '../../../hooks/playlist/useTrackPosts.js';
import { EmptyGenreState } from '../shared/EmptyGenreState';
import { AlbumArtPlayButton } from '../shared/AlbumArtPlayButton';
import { EmojiReactionBar } from '../shared/EmojiReactionBar';
import { useSongReport } from '../shared/useSongReport';
import { ReportReasonPopup } from '../shared/ReportReasonPopup';
import { useShareModal } from '../shared/useShareModal';
import { Toast } from '../shared/Toast';

interface TrackPostCollectionViewProps {
  track: TrackSummary;
  onBack: () => void;
  onSelectPost: (post: Song) => void;
  onPlay: () => void;
  // 지금 이 곡이 하단 플레이어에서 재생 중인지 — true면 재생 버튼을 숨김
  isPlaying?: boolean;
  // 게시글이 하나도 없을 때 뜨는 "이 곡 추천하러 가기" 버튼 — 지금 곡이 미리 채워진 채로 곡추천하기 화면으로 이동
  onRecommendTrack: (track: TrackSummary) => void;
}

const SORT_OPTIONS = [
  { key: 'latest', label: '최신' },
  { key: 'popular', label: '인기' },
] as const;

// 곡 단위 게시글 모음 화면 — 앨범커버 + 최신/인기 정렬 칩 + 게시글 리스트
export function TrackPostCollectionView({ track, onBack, onSelectPost, onPlay, isPlaying = false, onRecommendTrack }: TrackPostCollectionViewProps) {
  const [sort, setSort] = useState<TrackPostsSort>('latest');
  const { data, isLoading } = useTrackPosts(track.trackId, sort);
  const posts = data?.posts ?? [];
  const totalCount = data?.totalSongsCount ?? posts.length;
  const totalHeartCount = data?.totalHeartCount ?? 0;
  const totalPlayCount = data?.totalPlayCount ?? 0;
  // 딥링크(카카오 공유 등)로 trackId만 가지고 들어오면 track.title 등이 빈 문자열이라, useTrackPosts가
  // 받아온 값으로 채움 — 검색/차트 등에서 정상적으로 곡 정보를 들고 들어온 경우엔 이미 있는 track 값을 그대로 씀
  const displayTrack = {
    trackId: track.trackId,
    title: data?.title || track.title,
    artist: data?.artist || track.artist,
    albumArtUrl: data?.albumArtUrl || track.albumArtUrl,
  };
  // 딥링크로 들어와서 아직 곡 정보를 하나도 못 받은 상태 — 이때만 곡 정보 카드에 스켈레톤을 보여줌
  const isTrackInfoLoading = isLoading && !track.title && !data;

  const [bookmarkedByPost, setBookmarkedByPost] = useState<Record<string, boolean>>({});
  const [reactionsByPost, setReactionsByPost] = useState<Record<string, ReactionState>>({});
  // 게시글 목록을 새로 받아올 때마다(정렬 변경 포함) 서버가 준 초기 북마크/반응 상태로 로컬 상태를 다시 맞춤
  useEffect(() => {
    if (!data) return;
    const bookmarks: Record<string, boolean> = {};
    const reactions: Record<string, ReactionState> = {};
    for (const post of data.posts) {
      if (!post.id) continue;
      bookmarks[post.id] = post.isBookmarked ?? false;
      reactions[post.id] = toReactionState(post.reactions);
    }
    setBookmarkedByPost(bookmarks);
    setReactionsByPost(reactions);
  }, [data]);

  const [openPickerPostId, setOpenPickerPostId] = useState<string | null>(null);
  const report = useSongReport();
  const share = useShareModal(displayTrack);

  const toggleBookmark = useToggleBookmark();
  const toggleReactionMutation = useToggleReaction();

  // 낙관적으로 먼저 뒤집고, 서버 응답의 실제 isLiked로 맞추거나 실패 시 되돌림.
  // 로딩 표시로 막지 않고 연타도 그대로 받아서 매번 뒤집음 — 순수 낙관적 UI
  const handleToggleBookmark = (postId: string) => {
    const optimistic = !(bookmarkedByPost[postId] ?? false);
    setBookmarkedByPost((prev) => ({ ...prev, [postId]: optimistic }));
    toggleBookmark.mutate(postId, {
      onSuccess: (isLiked) => setBookmarkedByPost((prev) => ({ ...prev, [postId]: isLiked })),
      onError: () => setBookmarkedByPost((prev) => ({ ...prev, [postId]: !optimistic })),
    });
  };

  // 낙관적으로 카운트 증감 후, 서버가 내려준 그 곡의 9종 반응 전체 최신 값으로 통째로 맞춤. 연타는 무시
  const handleToggleReaction = (postId: string, key: ReactionKey) => {
    if (toggleReactionMutation.isPending) return;
    const previous = reactionsByPost[postId] ?? {};
    setReactionsByPost((prev) => {
      const current = prev[postId] ?? {};
      const currentReaction = current[key] ?? { count: 0, mine: false };
      const mine = !currentReaction.mine;
      const count = Math.max(0, currentReaction.count + (mine ? 1 : -1));
      return { ...prev, [postId]: { ...current, [key]: { count, mine } } };
    });

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

      {/* 곡 정보 — 앨범아트:정보 = 1:1 비율. 재생/북마크 수는 칩이 아니라 아이콘+숫자로 담백하게,
          게시글 수는 여기가 아니라 아래 게시글 목록 바로 위에 표기 */}
      {isTrackInfoLoading ? (
        <div className="flex items-center gap-3 mb-4 p-3 bg-white rounded-card border border-slate-200 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.03),0_8px_10px_-6px_rgba(0,0,0,0.03)]">
          <div className="w-1/2 aspect-square rounded-xl skeleton-shimmer flex-shrink-0" />
          <div className="min-w-0 flex-1 flex flex-col gap-2.5">
            <div className="space-y-1.5">
              <div className="h-4 w-2/3 skeleton-shimmer rounded-full" />
              <div className="h-3 w-1/3 skeleton-shimmer rounded-full" />
            </div>
            <div className="border-t border-slate-300" />
            <div className="h-5 w-full skeleton-shimmer rounded-full" />
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 mb-4 p-3 bg-white rounded-card border border-slate-200 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.03),0_8px_10px_-6px_rgba(0,0,0,0.03)]">
          <div className="relative w-1/2 flex-shrink-0">
            <img
              src={displayTrack.albumArtUrl}
              alt={displayTrack.title}
              className="w-full aspect-square rounded-xl object-cover bg-slate-100"
            />
            {/* 재생 중엔 버튼을 숨기고(일시정지 아이콘으로 바꾸지 않음), 다른 화면들과 동일한 스타일 */}
            {!isPlaying && <AlbumArtPlayButton onPlay={onPlay} label={`${displayTrack.title} 재생`} />}
          </div>
          <div className="min-w-0 flex-1 flex flex-col gap-2.5">
            <div>
              <div className="text-lg font-bold text-text-main truncate">{displayTrack.title}</div>
              <div className="text-[13px] text-text-sub truncate">{displayTrack.artist}</div>
            </div>
            <div className="border-t border-slate-300" />
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-xs font-semibold text-text-sub">
                <Play size={12} className="flex-shrink-0" fill="currentColor" stroke="none" />
                {totalPlayCount.toLocaleString()}회
              </span>
              <span className="flex items-center gap-1 text-xs font-semibold text-text-sub">
                <Heart size={12} className="flex-shrink-0" fill="currentColor" stroke="none" />
                {totalHeartCount.toLocaleString()}회
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onRecommendTrack(displayTrack)}
                aria-label="이 곡 추천하러 가기"
                className="h-8 pl-2.5 pr-3 rounded-full bg-slate-100 text-text-main border border-slate-200 flex items-center gap-1 active:scale-95 transition-transform"
              >
                <Music size={13} strokeWidth={2.2} />
                <span className="text-[11px] font-bold">곡추천하기</span>
              </button>
              <button
                onClick={() => share.open()}
                aria-label="공유하기"
                className="h-8 pl-2.5 pr-3 rounded-full bg-slate-100 text-text-main border border-slate-200 flex items-center gap-1 active:scale-95 transition-transform"
              >
                <Share2 size={13} strokeWidth={2} />
                <span className="text-[11px] font-bold">공유하기</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 정렬 칩 + 게시글 수 — 곡 정보 카드가 아니라 게시글 목록 바로 위에 표기 */}
      <div className="flex items-center justify-between mb-3 pl-2 pr-1">
        <div className="flex gap-2">
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.key}
              onClick={() => setSort(option.key)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all duration-200 active:scale-[0.96] ${
                sort === option.key
                  ? 'bg-[#618CE9] text-white border-transparent shadow-[0_4px_10px_rgba(15,23,42,0.35)]'
                  : 'bg-white text-[#618CE9] border-[#618CE9]'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <span className="text-xs font-semibold text-text-sub">게시글 {totalCount.toLocaleString()}개</span>
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
        <EmptyGenreState
          message="아직 이 곡을 추천한 게시글이 없어요"
          buttonLabel="이 곡 추천하러 가기"
          buttonIcon={<Music size={14} strokeWidth={2.5} />}
          onAction={() => onRecommendTrack(displayTrack)}
        />
      )}

      {/* 게시글 리스트 — 카드 사이 간격을 둬서 항목마다 분리된 느낌 */}
      <div className="flex flex-col gap-1">
        {posts.map((post) => {
          const postId = post.id;
          const bookmarked = postId ? bookmarkedByPost[postId] ?? false : false;
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
              {/* 본문 + 북마크/더보기 */}
              <div className="flex items-start gap-3">
                <p className="min-w-0 flex-1 text-[15px] text-text-main leading-snug line-clamp-2">
                  <span className="mr-[1px]">"</span>
                  {post.comment}
                  <span className="ml-[1px]">"</span>
                </p>

                {!post.isMine && (
                  <div className="flex items-start gap-3 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (postId) handleToggleBookmark(postId);
                      }}
                      aria-label="이 게시글 북마크"
                      className="active:scale-90 transition-transform"
                    >
                      <Heart
                        size={18}
                        className={bookmarked ? 'text-text-main' : 'text-text-sub'}
                        fill={bookmarked ? 'currentColor' : 'none'}
                        strokeWidth={2}
                      />
                    </button>
                    <div
                      ref={report.openMenuKey === (postId ?? '') ? report.menuRef : undefined}
                      className="relative inline-block flex-shrink-0"
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          report.toggleMenu(postId ?? '');
                        }}
                        aria-label="더보기"
                        className="active:scale-90 transition-transform"
                      >
                        <MoreVertical size={18} className="text-text-sub" />
                      </button>

                      {report.openMenuKey === (postId ?? '') && (
                        <div className="absolute top-full right-0 mt-0.5 z-20 bg-white border border-slate-200 rounded-xl shadow-[0_10px_25px_-5px_rgba(0,0,0,0.15)] overflow-hidden">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              report.openReasonPopup(postId);
                            }}
                            className="block w-full px-4 py-2.5 text-left text-sm font-semibold text-red-500 hover:bg-slate-50 whitespace-nowrap"
                          >
                            신고하기
                          </button>
                        </div>
                      )}
                    </div>
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

      {share.node}
    </div>
  );
}
