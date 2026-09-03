import { Heart, ChevronRight, MoreVertical, Share2 } from 'lucide-react';
import { useState } from 'react';
import { type Song, type PlaylistReaction, type ReactionState, type TrackSummary, GENRES, formatTimeAgo, toReactionState } from '../playlistTypes';
import { type ReactionKey } from '../postReactions';
import { useToggleBookmark } from '../../../hooks/playlist/useToggleBookmark.js';
import { useToggleReaction } from '../../../hooks/playlist/useToggleReaction.js';
import { AlbumArtPlayButton } from './AlbumArtPlayButton';
import { EmojiReactionBar } from './EmojiReactionBar';
import { useSongReport } from './useSongReport';
import { ReportReasonPopup } from './ReportReasonPopup';
import { useShareModal } from './useShareModal';
import { Toast } from './Toast';

export interface PostDetailCardData {
  // 신고하기 등 서버에 곡 id가 필요한 액션에 씀 — 실제 API 연동 전 더미 게시글엔 없을 수 있어서 옵셔널
  id?: string;
  trackId: string;
  albumArtUrl: string;
  title: string;
  artist: string;
  body: string;
  genres: string[];
  createdAt: Date | string;
  // 서버가 계산해서 내려주는 "지금 이 기기가 북마크했는지" 여부 — 없으면 false로 시작
  isBookmarked?: boolean;
  // 지금 이 기기가 등록한 게시글인지 — true면 북마크/신고 아이콘을 자동으로 숨김
  isMine?: boolean;
  // 서버가 내려주는 이모지별 반응 수 + 내 반응 여부 — 없으면 반응 0개로 시작
  reactions?: PlaylistReaction[];
}

interface PostDetailCardProps {
  post: PostDetailCardData;
  className?: string;
  // 넘겨줄 때만 앨범커버 중앙에 재생 버튼이 뜸
  onPlay?: () => void;
  // 지금 이 곡이 하단 플레이어에서 재생 중인지 — true면 재생 버튼을 숨김
  isPlaying?: boolean;
  // true면 이모지 리액션을 숨김 — 빠르게 훑어보는 요약 목록(2열)용
  hideReactions?: boolean;
  // 넘겨주면 카드 전체가 클릭 가능해짐 — 요약 목록(2열)에서 눌러 상세(1열)로 전환할 때 사용
  onSelect?: () => void;
  // 넘겨주면 곡명·가수명을 눌렀을 때 이 곡의 게시글 모음(TrackPostCollectionView)으로 이동 — 카드 자체의
  // onSelect(게시글 상세 보기)와는 별개 동작이라 화살표 아이콘으로 구분해서 보여줌
  onSelectTrack?: (track: TrackSummary) => void;
}

// 리스트/캐러셀에서 쓰는 Song 엔티티를 PostDetailCard가 받는 형태로 변환 (본문=comment)
export function songToPostDetailCardData(song: Song): PostDetailCardData {
  return {
    id: song.id,
    trackId: song.trackId,
    albumArtUrl: song.albumArtUrl,
    title: song.title,
    artist: song.artist,
    body: song.comment,
    genres: song.genres,
    createdAt: song.createdAt,
    isBookmarked: song.isBookmarked,
    isMine: song.isMine,
    reactions: song.reactions,
  };
}

// 인스타그램 게시물처럼 앨범커버와 하단 콘텐츠가 하나의 카드로 이어지는 게시글 조회 카드. PostView에서 사용
export function PostDetailCard({
  post,
  className = '',
  onPlay,
  isPlaying = false,
  hideReactions = false,
  onSelect,
  onSelectTrack,
}: PostDetailCardProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [reactions, setReactions] = useState<ReactionState>(() => toReactionState(post.reactions));
  const [bookmarked, setBookmarked] = useState(post.isBookmarked ?? false);
  const report = useSongReport();
  const share = useShareModal({ trackId: post.trackId, title: post.title, artist: post.artist, albumArtUrl: post.albumArtUrl });
  const toggleBookmark = useToggleBookmark();
  const toggleReactionMutation = useToggleReaction();

  // 먼저 로컬 카운트를 낙관적으로 증감시켜 바로 반응이 보이게 하고(서버가 내려준 count엔 이미 내 반응이
  // 포함돼 있어 +1/-1로 계산), 서버 응답이 오면 그 곡의 9종 반응 전체 최신 값으로 통째로 맞춤.
  // 실패하면 원래 상태로 되돌림. post.id가 없는(아직 더미인) 게시글은 API 호출 없이 로컬로만 토글.
  // 이전 요청이 아직 처리 중이면 연타를 무시 — 여러 요청이 동시에 나가면 응답 도착 순서가
  // 클릭 순서와 안 맞아서 최종 상태가 서버 상태와 어긋날 수 있음
  const toggleReaction = (key: ReactionKey) => {
    if (toggleReactionMutation.isPending) return;
    const previous = reactions;
    setReactions((prev) => {
      const current = prev[key] ?? { count: 0, mine: false };
      const mine = !current.mine;
      const count = Math.max(0, current.count + (mine ? 1 : -1));
      return { ...prev, [key]: { count, mine } };
    });

    if (!post.id) return;

    toggleReactionMutation.mutate(
      { songId: post.id, reactionType: key },
      {
        onSuccess: (updatedReactions) => setReactions(toReactionState(updatedReactions)),
        onError: () => setReactions(previous),
      }
    );
  };

  // 서버 응답이 오기 전에 먼저 눈에 보이게 뒤집고(낙관적 업데이트), 응답 오면 실제 값으로 맞추거나
  // 실패 시 원래 상태로 되돌림. 로딩 표시로 막지 않고 연타도 그대로 받아서 매번 뒤집음 — 순수 낙관적 UI
  const toggleBookmarked = () => {
    if (!post.id) {
      setBookmarked((prev) => !prev);
      return;
    }
    const optimistic = !bookmarked;
    setBookmarked(optimistic);
    toggleBookmark.mutate(post.id, {
      onSuccess: (isLiked) => setBookmarked(isLiked),
      onError: () => setBookmarked(!optimistic),
    });
  };

  // 곡명·가수명을 누르면 이 곡의 게시글 모음(TrackPostCollectionView)으로 이동 — 카드 전체 클릭(onSelect)과
  // 별개 동작이라 전파를 막음. 단, 카드 자체가 이미 onSelect로 클릭 가능한 요약 목록(2열)에서는
  // 카드 전체가 게시글 상세로 가는 단일 탭 영역이어야 해서 제목만 따로 분리하지 않음
  const showTrackLink = !!onSelectTrack && !onSelect;
  const handleSelectTrackClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    onSelectTrack?.({ trackId: post.trackId, title: post.title, artist: post.artist, albumArtUrl: post.albumArtUrl });
  };
  const titleInteractiveProps = showTrackLink
    ? {
        onClick: handleSelectTrackClick,
        role: 'button' as const,
        tabIndex: 0,
        onKeyDown: (e: { key: string; stopPropagation: () => void }) => {
          if (e.key === 'Enter' || e.key === ' ') handleSelectTrackClick(e);
        },
        'aria-label': `${post.title} 게시글 모음 보기`,
      }
    : {};

  // 2열(hideReactions, 요약 카드)에서는 제목/가수명을 세로로 쌓고, 1열에서는 "제목 · 가수명" 한 줄로 표시
  const titleBlock = hideReactions ? (
    <div className={`min-w-0 ${showTrackLink ? 'cursor-pointer' : ''}`} {...titleInteractiveProps}>
      <div className="flex items-center gap-0.5">
        <span className="text-sm font-bold text-text-main truncate">{post.title}</span>
        {showTrackLink && <ChevronRight size={16} className="flex-shrink-0 text-text-sub" />}
      </div>
      <div className="text-xs font-medium text-text-sub truncate">{post.artist}</div>
    </div>
  ) : (
    <div className={`flex items-center gap-0.5 min-w-0 ${showTrackLink ? 'cursor-pointer' : ''}`} {...titleInteractiveProps}>
      <span className="truncate min-w-0">
        <span className="text-base font-bold text-text-main">{post.title}</span>
        <span className="text-sm font-medium text-text-sub"> · {post.artist}</span>
      </span>
      {showTrackLink && <ChevronRight size={19} className="flex-shrink-0 text-text-sub" />}
    </div>
  );

  // 더보기 버튼: 앨범 커버 바로 아래 첫 행의 맨 오른쪽에 위치 —
  // 1열(리액션 있음)에서는 리액션 행, 2열(리액션 숨김)에서는 제목 행에 합류
  const moreButton = (
    <div ref={report.menuRef} className="relative inline-block flex-shrink-0">
      <button
        onClick={(e) => {
          e.stopPropagation();
          report.toggleMenu('more');
        }}
        aria-label="더보기"
        className="active:scale-90 transition-transform"
      >
        <MoreVertical size={18} className="text-text-sub" />
      </button>

      {report.openMenuKey === 'more' && (
        <div className="absolute top-full right-0 mt-0.5 z-20 bg-white border border-slate-200 rounded-xl shadow-[0_10px_25px_-5px_rgba(0,0,0,0.15)] overflow-hidden">
          <button
            onClick={(e) => {
              e.stopPropagation();
              report.openReasonPopup(post.id);
            }}
            className="block w-full px-4 py-2.5 text-left text-sm font-semibold text-red-500 hover:bg-slate-50 whitespace-nowrap"
          >
            신고하기
          </button>
        </div>
      )}
    </div>
  );

  // 공유/북마크 배지 크기 — 1열은 36px, 2열(좁은 요약 카드)은 그보다 더 작게(28px).
  // offset은 "공유 버튼 폭 + 간격(10px)" 고정값 — 공유가 모서리(right-[4%]), 북마크가 그 왼쪽
  const actionBadgeSizeClass = hideReactions ? 'w-7' : 'w-9';
  const bookmarkBadgeRightClass = hideReactions ? 'right-[calc(4%_+_38px)]' : 'right-[calc(4%_+_46px)]';
  // 2열(요약 카드)의 재생 버튼은 카드 폭 자체가 좁아서 같은 16%라도 절대 크기가 작아 보임 — 더 큰 비율로 보정
  const playButtonSizeClass = hideReactions ? 'w-[22%]' : 'w-[16%]';

  return (
    <div
      onClick={onSelect}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onKeyDown={
        onSelect
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') onSelect();
            }
          : undefined
      }
      aria-label={onSelect ? `${post.title} 상세 보기` : undefined}
      className={`flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-[0_10px_25px_-5px_rgba(0,0,0,0.03),0_8px_10px_-6px_rgba(0,0,0,0.03)] ${onSelect ? 'cursor-pointer' : ''} ${className}`}
    >
      {/* 앨범 커버 */}
      <div className="relative">
        <img
          src={post.albumArtUrl}
          alt={post.title}
          className="w-full aspect-square object-cover bg-slate-100"
        />

        {onPlay && !isPlaying && (
          // 버튼 히트 영역을 앨범커버 전체가 아니라 눈에 보이는 원(카드 폭 대비 %)만큼만 잡아서,
          // 그 바깥을 누르면 카드 자체의 onSelect(상세로 전환/게시글 보기)로 넘어가게 함
          <AlbumArtPlayButton onPlay={onPlay} label={`${post.title} 재생`} sizeClass={playButtonSizeClass} />
        )}

        {/* 앨범커버 우측 하단 공유하기/북마크 배지 — 둘 다 "곡에 대한 액션"이라 한 코너에 나란히 묶어서
            서로 멀리 떨어져 있어 공유 버튼을 놓치는 일이 없게 함. 북마크는 자기 글을 북마크할 이유가
            없는 본인 게시글에서만 숨김. 공유 클릭 동작(카카오톡/링크 공유 시트)은 다음 단계에서 연결
            (각 배지를 .relative 앨범커버 컨테이너에 직접 매다는 이유: flex 래퍼로 한 번 더 감싸면
            그 래퍼가 width:auto라 안의 w-[20%]가 기준으로 삼을 폭이 없어져 버튼이 찌그러들었음) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            share.open();
          }}
          aria-label="공유하기"
          className={`absolute bottom-[4%] right-[4%] z-10 ${actionBadgeSizeClass} aspect-square rounded-full bg-white/30 backdrop-blur-md border border-white/40 flex items-center justify-center shadow-md active:scale-95 transition-transform`}
        >
          <Share2 className="w-1/2 h-1/2 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.45)]" strokeWidth={2} />
        </button>

        {!post.isMine && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleBookmarked();
            }}
            aria-label="북마크"
            className={`absolute bottom-[4%] z-10 ${actionBadgeSizeClass} aspect-square rounded-full bg-white/30 backdrop-blur-md border border-white/40 flex items-center justify-center shadow-md active:scale-95 transition-transform ${bookmarkBadgeRightClass}`}
          >
            <Heart className="w-1/2 h-1/2 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.45)]" strokeWidth={2} fill={bookmarked ? 'currentColor' : 'none'} />
          </button>
        )}
      </div>

      <div className="px-4 pt-3 pb-4 flex-1 flex flex-col">
        {!hideReactions && (
          <div className="flex items-center gap-1.5 mb-2">
            <EmojiReactionBar
              reactions={reactions}
              onToggleReaction={toggleReaction}
              disabled={toggleReactionMutation.isPending}
              pickerOpen={pickerOpen}
              onTogglePicker={() => setPickerOpen((prev) => !prev)}
              className="flex-1 min-w-0"
              emptyFallback={
                // 배경 없는 안내 문구만 살짝 얹음. 클릭 가능한 건 왼쪽 이모지 추가 버튼 하나로 충분해서,
                // 여기는 버튼처럼 보이지 않게 배경/클릭 이벤트 없이 텍스트로만 둠
                <span className="flex-1 min-w-0 truncate text-[11px] text-text-hint">
                  ← 아직 반응이 없어요, 첫 반응을 남겨주세요!
                </span>
              }
            />

            {!post.isMine && moreButton}
          </div>
        )}

        <div className={`mb-1 ${hideReactions ? 'flex items-center gap-2' : ''}`}>
          <div className={hideReactions ? 'flex-1 min-w-0' : ''}>{titleBlock}</div>
          {hideReactions && !post.isMine && moreButton}
        </div>

        {/* 본문 */}
        {post.body && (
          <p
            className={`${hideReactions ? 'text-xs line-clamp-3' : 'text-sm'} text-text-main leading-relaxed mb-2 whitespace-pre-line`}
          >
            <span className="mr-[1px]">"</span>
            {post.body}
            <span className="ml-[1px]">"</span>
          </p>
        )}

        {/* 구분선 + 장르(최대 3개) — 묶어서 mt-auto로 카드 하단에 고정. 구분선을 장르 행과
            분리해두면 2열 그리드에서 카드 높이가 늘어날 때(본문이 짧은 카드) 구분선만 본문
            바로 아래 뜨고 장르는 저 밑에 떨어져 보였어서, 항상 장르 바로 위에 붙도록 묶음 */}
        <div className="mt-auto">
          <div className="border-t border-slate-100 mb-3" />
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-x-1 gap-y-1 text-xs font-medium text-text-sub">
              {post.genres.flatMap((label, index) => {
                const genre = GENRES.find((g) => g.label === label);
                const chip = (
                  <span key={label} className="flex items-center">
                    {genre?.emoji && <span>{genre.emoji}</span>}
                    <span>{label}</span>
                  </span>
                );
                if (index === 0) return [chip];
                return [
                  <span key={`${label}-dot`} className="text-text-hint" aria-hidden="true">·</span>,
                  chip,
                ];
              })}
            </div>
            {!hideReactions && (
              <span className="flex-shrink-0 text-xs text-text-hint">{formatTimeAgo(post.createdAt)}</span>
            )}
          </div>
        </div>
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
