import { ArrowRight, Bookmark, MoreVertical, Play, Search, Share2, Smile } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { MiscSubViewHeader } from '../misc/MiscSubViewHeader';
import { type TrackResult } from './SearchResultsView';
import { type ReactionKey, EMOJI_REACTIONS } from './postReactions';
import { type Song, type ReactionState, formatTimeAgo, toReactionState } from './playlistTypes';
import { useToggleBookmark, useReportSong, useToggleReaction, useTrackPosts, type TrackPostsSort } from '../../hooks/useRecentSongs.js';
import { SongShareModal } from './SongShareModal';

interface TrackPostCollectionViewProps {
  track: TrackResult;
  onBack: () => void;
  onSelectPost: (post: Song) => void;
  onPlay: () => void;
  // 지금 이 곡이 하단 플레이어에서 재생 중인지 — true면 재생 버튼을 숨김
  isPlaying?: boolean;
  // 홈 검색바와 동일한 로직(Enter/화살표 → 검색 결과 화면) — 상태는 PlaylistView가 들고 있음
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSubmitSearch: () => void;
}

const SORT_OPTIONS = [
  { key: 'latest', label: '최신' },
  { key: 'popular', label: '인기' },
] as const;

const REPORT_REASONS = ['부적절하거나 선정적인 표현', '욕설·비속어 포함', '스팸/광고성 게시글', '기타'];

// 곡 단위 게시글 모음 화면 — 앨범커버 + 최신/인기 정렬 칩 + 게시글 리스트
export function TrackPostCollectionView({ track, onBack, onSelectPost, onPlay, isPlaying = false, searchQuery, setSearchQuery, onSubmitSearch }: TrackPostCollectionViewProps) {
  const [sort, setSort] = useState<TrackPostsSort>('latest');
  const { data, isLoading } = useTrackPosts(track.trackId, sort);
  const posts = data?.posts ?? [];
  const totalCount = data?.totalSongsCount ?? posts.length;
  const totalHeartCount = data?.totalHeartCount ?? 0;
  const totalPlayCount = data?.totalPlayCount ?? 0;

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
  const [reportMenuOpenPostId, setReportMenuOpenPostId] = useState<string | null>(null);
  const [reportReasonPopupPostId, setReportReasonPopupPostId] = useState<string | null>(null);
  const [selectedReportReason, setSelectedReportReason] = useState<string | null>(null);
  const [reportToast, setReportToast] = useState('');
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareCopiedToast, setShareCopiedToast] = useState(false);
  const reportMenuRef = useRef<HTMLDivElement>(null);

  const toggleBookmark = useToggleBookmark();
  const toggleReactionMutation = useToggleReaction();
  const reportSong = useReportSong();

  // 신고하기 드롭다운이 열려있을 때, 버튼/드롭다운 바깥을 누르면 닫음
  useEffect(() => {
    if (!reportMenuOpenPostId) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (reportMenuRef.current && !reportMenuRef.current.contains(e.target as Node)) {
        setReportMenuOpenPostId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [reportMenuOpenPostId]);

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

  const handleConfirmReport = () => {
    if (!reportReasonPopupPostId || !selectedReportReason) return;
    reportSong.mutate(
      { songId: reportReasonPopupPostId, reason: selectedReportReason },
      {
        onSuccess: () => {
          setReportReasonPopupPostId(null);
          setSelectedReportReason(null);
          setReportToast('신고가 접수됐어요. 검토 후 조치할게요.');
          setTimeout(() => setReportToast(''), 2000);
        },
      }
    );
  };

  return (
    <div className="pb-[calc(var(--playlist-bottom-space,204px)+env(safe-area-inset-bottom))] transition-[padding-bottom] duration-300 ease-out">
      <MiscSubViewHeader
        title="게시글 모음"
        emoji="💬"
        subtitle={`'${track.title} · ${track.artist}' 의 추천 게시글을 다 모았어요!`}
        onBack={onBack}
      />

      {/* 검색바: 홈 검색바와 동일한 UI·로직 — Enter 또는 화살표를 누르면 검색 결과 화면으로 이동 */}
      <div className="mb-4 flex items-center gap-2 pl-2 pr-2.5 h-12 bg-[#618CE9]/[0.06] border border-[#618CE9]/20 rounded-full focus-within:border-[#618CE9] focus-within:shadow-[0_0_0_3px_rgba(15,23,42,0.15)] transition-all">
        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#618CE9]/15 flex items-center justify-center">
          <Search size={15} className="text-[#618CE9]" />
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSubmitSearch();
          }}
          placeholder="다른 곡도 추천됐는지 검색해보세요!"
          className="flex-1 min-w-0 bg-transparent text-sm text-text-main placeholder-text-hint outline-none"
        />
        <button
          onClick={onSubmitSearch}
          disabled={!searchQuery.trim()}
          aria-label="검색"
          className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-[#618CE9] text-white disabled:bg-slate-200 disabled:text-text-hint transition-all active:scale-90"
        >
          <ArrowRight size={14} />
        </button>
      </div>

      {/* 곡 정보 — 앨범아트:정보 = 1:1 비율. 정보 쪽은 통계를 색깔 있는 뱃지로 다양하게 채워서
          큰 앨범아트 옆이 휑해 보이지 않게 함 */}
      <div className="flex items-center gap-3 mb-4 p-3 bg-white rounded-card border border-slate-200 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.03),0_8px_10px_-6px_rgba(0,0,0,0.03)]">
        <img
          src={track.albumArtUrl}
          alt={track.title}
          className="w-1/2 aspect-square rounded-xl object-cover bg-slate-100 flex-shrink-0"
        />
        <div className="min-w-0 flex-1 flex flex-col gap-2.5">
          <div>
            <div className="text-lg font-bold text-text-main truncate">{track.title}</div>
            <div className="text-[13px] text-text-sub truncate">{track.artist}</div>
          </div>
          <div className="border-t border-slate-300" />
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-rose-50 text-[11px] font-bold text-rose-500">
              <span className="text-xs">🔖</span>
              북마크 {totalHeartCount.toLocaleString()}
            </span>
            <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-sky-50 text-[11px] font-bold text-sky-600">
              <span className="text-xs">🎧</span>
              재생 {totalPlayCount.toLocaleString()}
            </span>
            <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-50 text-[11px] font-bold text-amber-600">
              <span className="text-xs">💬</span>
              게시글 {totalCount.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!isPlaying && (
              <button
                onClick={onPlay}
                aria-label={`${track.title} 재생`}
                className="w-9 h-9 rounded-full bg-slate-800 text-white shadow-[0_4px_10px_rgba(0,0,0,0.25)] flex items-center justify-center active:scale-90 transition-transform"
              >
                <Play size={16} fill="white" stroke="white" strokeWidth={1} />
              </button>
            )}
            <button
              onClick={() => setShareModalOpen(true)}
              aria-label="공유하기"
              className="w-9 h-9 rounded-full bg-slate-800 text-white shadow-[0_4px_10px_rgba(0,0,0,0.25)] flex items-center justify-center active:scale-90 transition-transform"
            >
              <Share2 size={16} strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>

      {/* 정렬 칩 */}
      <div className="flex gap-2 mb-3 pl-2">
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
        <p className="py-10 text-center text-sm text-text-sub">아직 이 곡을 추천한 게시글이 없어요</p>
      )}

      {/* 게시글 리스트 — 카드 사이 간격을 둬서 항목마다 분리된 느낌 */}
      <div className="flex flex-col gap-1">
        {posts.map((post) => {
          const postId = post.id;
          const bookmarked = postId ? bookmarkedByPost[postId] ?? false : false;
          const reactions = (postId ? reactionsByPost[postId] : undefined) ?? {};
          const displayedReactions = EMOJI_REACTIONS.filter(({ key }) => (reactions[key]?.count ?? 0) > 0);

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
                <p className="min-w-0 flex-1 text-[15px] text-text-main leading-snug line-clamp-2">{post.comment}</p>

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
                      <Bookmark
                        size={18}
                        className={bookmarked ? 'text-text-main' : 'text-text-sub'}
                        fill={bookmarked ? 'currentColor' : 'none'}
                        strokeWidth={2}
                      />
                    </button>
                    <div
                      ref={reportMenuOpenPostId === postId ? reportMenuRef : undefined}
                      className="relative inline-block flex-shrink-0"
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setReportMenuOpenPostId((prev) => (prev === postId ? null : postId ?? null));
                        }}
                        aria-label="더보기"
                        className="active:scale-90 transition-transform"
                      >
                        <MoreVertical size={18} className="text-text-sub" />
                      </button>

                      {reportMenuOpenPostId === postId && (
                        <div className="absolute top-full right-0 mt-0.5 z-20 bg-white border border-slate-200 rounded-xl shadow-[0_10px_25px_-5px_rgba(0,0,0,0.15)] overflow-hidden">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setReportMenuOpenPostId(null);
                              setReportReasonPopupPostId(postId ?? null);
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
                {/* 이모지 추가 버튼 — 다른 모양의 이모지도 고를 수 있도록 */}
                <div className="relative inline-block flex-shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenPickerPostId((prev) => (prev === postId ? null : postId ?? null));
                    }}
                    disabled={toggleReactionMutation.isPending}
                    aria-label="이모지 추가"
                    className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center active:scale-90 transition-transform"
                  >
                    <Smile size={11} className="text-text-sub" strokeWidth={2} />
                  </button>

                  {openPickerPostId === postId && (
                    <div className="absolute bottom-full left-0 mb-2 z-10">
                      <div className="flex gap-1 px-2 py-1.5 bg-white border border-slate-200 rounded-full shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)]">
                        {EMOJI_REACTIONS.map(({ key, emoji }) => (
                          <button
                            key={key}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (postId) handleToggleReaction(postId, key);
                              setOpenPickerPostId(null);
                            }}
                            aria-label={`${emoji} 남기기`}
                            className="w-8 h-8 flex items-center justify-center text-base rounded-full hover:bg-slate-100 active:scale-90 transition-transform"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                      {/* 말풍선 꼬리 */}
                      <div className="w-3 h-3 bg-white border-r border-b border-slate-200 rotate-45 ml-3 -mt-1.5" />
                    </div>
                  )}
                </div>

                {displayedReactions.length > 0 && (
                  <div
                    className="flex items-center gap-1 flex-1 min-w-0 overflow-x-auto [&::-webkit-scrollbar]:hidden"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    {displayedReactions.map(({ key, emoji }) => {
                      const { count, mine } = reactions[key] ?? { count: 0, mine: false };
                      return (
                        <button
                          key={key}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (postId) handleToggleReaction(postId, key);
                          }}
                          disabled={toggleReactionMutation.isPending}
                          aria-label={`${emoji} 반응 ${mine ? '취소' : '남기기'}`}
                          className={`flex-shrink-0 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold border transition-all active:scale-95 ${
                            mine ? 'bg-primary/10 border-primary text-primary' : 'bg-slate-100 border-transparent text-text-sub'
                          }`}
                        >
                          <span className="text-xs">{emoji}</span>
                          <span>{count}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                <span className="flex-shrink-0 text-xs text-text-hint ml-auto">{formatTimeAgo(post.createdAt)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 신고 사유 선택 팝업 */}
      {reportReasonPopupPostId && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 px-8"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-full max-w-[300px] bg-white rounded-2xl shadow-xl px-5 py-5">
            <p className="text-sm font-semibold text-text-main mb-3 text-center">신고 사유를 선택해주세요</p>
            <div className="flex flex-col gap-1.5 mb-4">
              {REPORT_REASONS.map((reason) => (
                <button
                  key={reason}
                  onClick={() => setSelectedReportReason(reason)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
                    selectedReportReason === reason
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-slate-100 border-transparent text-text-sub hover:bg-slate-200'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>
            {reportSong.isError && (
              <p className="text-xs text-red-500 text-center mb-3">신고 접수에 실패했어요. 다시 시도해주세요.</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setReportReasonPopupPostId(null);
                  setSelectedReportReason(null);
                }}
                className="flex-1 h-10 rounded-full text-sm font-bold text-text-sub bg-slate-100 active:scale-[0.97] transition-transform"
              >
                취소
              </button>
              <button
                onClick={handleConfirmReport}
                disabled={!selectedReportReason || reportSong.isPending}
                className={`flex-1 h-10 rounded-full text-sm font-bold active:scale-[0.97] transition-transform ${
                  selectedReportReason && !reportSong.isPending ? 'text-white bg-red-500' : 'text-slate-300 bg-slate-100'
                }`}
              >
                {reportSong.isPending ? '접수 중...' : '신고하기'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 신고 접수 완료 토스트 */}
      {reportToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-[rgba(15,23,42,0.85)] text-white text-[0.78rem] font-medium px-4 py-2 rounded-full z-[200] whitespace-pre-line text-center copy-toast">
          {reportToast}
        </div>
      )}

      {shareModalOpen && (
        <SongShareModal
          song={{ title: track.title, artist: track.artist, albumArtUrl: track.albumArtUrl }}
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
