import { Heart, ChevronRight, Pause, Play, Share2 } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { type Song, type PlaylistReaction, type ReactionState, type TrackSummary, GENRES, formatTimeAgo, toReactionState } from '../playlistTypes';
import { type ReactionKey } from '../postReactions';
import { usePostInteractionMutations, nextOptimisticReaction } from '../../../hooks/playlist/usePostInteractions.js';
import { type RecentSongsTapAreaVariant } from '../../../hooks/playlist/usePlaylistExperiment';
import { AlbumArtPlayButton } from './AlbumArtPlayButton';
import { EmojiReactionBar } from './EmojiReactionBar';
import { useSongReport } from './useSongReport';
import { ReportReasonPopup } from './ReportReasonPopup';
import { PostMoreMenu } from './PostMoreMenu';
import { useShareModal } from './useShareModal';
import { Toast } from './Toast';
import { useLikeToast } from './useLikeToast';

export const BODY_TOGGLE_MS = 300; // 2열 카드 한마디 더보기/접기 애니메이션 시간 — 본문의 duration-300과 같은 값이어야 함

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
  // 서버가 계산해서 내려주는 "지금 이 기기가 좋아요했는지" 여부 — 없으면 false로 시작
  isLiked?: boolean;
  // 지금 이 기기가 등록한 게시글인지 — true면 신고 아이콘을 자동으로 숨김(좋아요는 본인 글도 가능)
  isMine?: boolean;
  // 서버가 내려주는 이모지별 반응 수 + 내 반응 여부 — 없으면 반응 0개로 시작
  reactions?: PlaylistReaction[];
}

interface PostDetailCardProps {
  post: PostDetailCardData;
  className?: string;
  // 넘겨줄 때만 앨범커버 중앙에 재생 버튼이 뜸
  onPlay?: () => void;
  // 지금 이 곡이 하단 플레이어에서 재생 중인지 — true면 재생 아이콘이 일시정지 아이콘으로 바뀜
  isPlaying?: boolean;
  // true면 이모지 리액션을 숨김 — 빠르게 훑어보는 요약 목록(2열)용
  hideReactions?: boolean;
  // true면 2열 그리드처럼 폭이 좁은 카드용 크기로 그림 — 재생/공유/좋아요 버튼 비율을 키우고, 본문은 3줄로 자르고, 이모지 선택창을 3×3으로 배치.
  // 하단 구성(이모지 반응 행·제목·본문·장르·시간)은 1열과 동일하게 유지. hideReactions를 쓰는 요약 카드(저장한 곡)는 자동으로 narrow 취급
  narrow?: boolean;
  // 이모지 선택창을 이모지 버튼이 아니라 카드 가장자리 기준으로 띄움 — 2열처럼 카드 폭보다 선택창이 넓을 때 씀.
  // 왼쪽 열 카드는 'left'(오른쪽으로 펼침), 오른쪽 열 카드는 'right'(왼쪽으로 펼침). 안 넘기면 1열처럼 버튼 기준
  pickerAnchor?: 'left' | 'right';
  // 이모지 선택창 열림 상태를 부모가 제어 — 목록에서 카드 여러 개 중 선택창이 하나만 열려 있게 할 때 씀.
  // 둘 다 안 넘기면 카드가 혼자 관리(게시글 상세 등 카드가 하나뿐인 화면)
  pickerOpen?: boolean;
  onPickerOpenChange?: (open: boolean) => void;
  // 2열에서 한마디를 펼치거나 접기 "시작하는 순간" 호출(레이아웃이 바뀌기 전) — 부모가 이웃 카드 높이를 미리 재서 고정하는 데 씀
  onBodyExpandedChange?: (expanded: boolean) => void;
  // 넘겨주면 카드 전체가 클릭 가능해짐 — 요약 목록(2열)에서 눌러 상세(1열)로 전환할 때 사용
  onSelect?: () => void;
  // 넘겨주면 곡명·가수명을 눌렀을 때 이 곡의 게시글 모음(TrackPostCollectionView)으로 이동 — 카드 자체의
  // onSelect(게시글 상세 보기)와는 별개 동작이라 화살표 아이콘으로 구분해서 보여줌
  onSelectTrack?: (track: TrackSummary) => void;
  // 제목 행 오른쪽 버튼 종류 — 기본 'more'는 더보기(⋯ → 신고하기), 'trackLink'는 같은 자리에 > 버튼을 두고 누르면
  // 이 곡의 게시글 모음으로 이동(onSelectTrack 필요). 신고는 게시글 모음 화면에서 할 수 있음.
  // 'trackLink'면 제목 옆의 작은 > 아이콘은 중복이라 숨김
  trailingAction?: 'more' | 'trackLink';
  // true면 곡명·가수명만 보여줌 — 본문·구분선·장르를 숨기고 하단 여백도 줄임(곡 단위로 훑어보는 저장한 곡 목록용)
  compact?: boolean;
  // "최근 추가된 곡" 재생 인터랙션 A/B 테스트에서 재생 버튼 위치/히트영역만 바꾸는 배정값
  // (docs/playlist-recent-songs-ab-test.md 참고). 안 넘기면 기존(control: 정중앙 원형 버튼) 동작 — 최근추가된곡
  // 화면 외의 다른 화면(게시글 상세/게시글 모음 등)은 이 prop을 넘기지 않아 항상 control로 유지됨
  playButtonVariant?: RecentSongsTapAreaVariant;
  // true면 내 글이어도 "내 추천" 뱃지를 숨김 — 전부 내 글인 "추천한 곡" 화면에서는 정보량이 없어서 끔
  hideMineBadge?: boolean;
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
    isLiked: song.isLiked,
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
  narrow = false,
  pickerAnchor,
  pickerOpen: pickerOpenProp,
  onPickerOpenChange,
  onBodyExpandedChange,
  onSelect,
  onSelectTrack,
  trailingAction = 'more',
  compact = false,
  playButtonVariant = 'control',
  hideMineBadge = false,
}: PostDetailCardProps) {
  const isTestPlayButton = playButtonVariant === 'test';
  const showMineBadge = !!post.isMine && !hideMineBadge;
  const isNarrow = narrow || hideReactions; // 2열처럼 폭이 좁은 카드 — 버튼 비율·글자 크기·이모지 선택창 배치를 좁은 폭에 맞춤

  // 2열(좁은 카드)은 본문을 3줄로 자르는데, 잘린 글을 보려고 카드를 누르면 1열 상세로 전환돼버려서
  // 잘렸을 때만 "더보기/접기" 토글을 보여줌. 잘렸는지는 접힌 상태에서 실제 높이(scrollHeight)와 보이는 높이(clientHeight)를 비교해 판단
  const bodyRef = useRef<HTMLParagraphElement>(null);
  const [bodyExpanded, setBodyExpanded] = useState(false);
  const [isBodyClamped, setIsBodyClamped] = useState(false);
  // line-clamp는 높이 transition이 안 먹어서, 펼치고 접는 동안엔 line-clamp를 잠깐 풀고 max-height(px)를 직접 움직여 애니메이션함.
  // isClampApplied: line-clamp-3(말줄임표)가 걸려 있는지 / bodyMaxHeight: 애니메이션 중 inline max-height(null이면 제한 없음)
  const [isClampApplied, setIsClampApplied] = useState(true);
  const [bodyMaxHeight, setBodyMaxHeight] = useState<number | null>(null);
  const bodyTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(bodyTimerRef.current), []);

  useLayoutEffect(() => {
    const el = bodyRef.current;
    // 펼쳤거나 애니메이션 중(clamp가 풀린 동안)엔 잘림 여부를 다시 재지 않음 — 토글 버튼이 사라지지 않게 마지막 값을 유지
    if (!el || !isNarrow || !isClampApplied || bodyExpanded) return;
    const measure = () => setIsBodyClamped(el.scrollHeight > el.clientHeight + 1);
    measure();
    const observer = new ResizeObserver(measure); // 화면 회전 등으로 카드 폭이 바뀌어 줄 수가 달라질 때 다시 잼
    observer.observe(el);
    return () => observer.disconnect();
  }, [post.body, isNarrow, isClampApplied, bodyExpanded]);

  const canToggleBody = isNarrow && !compact && !!post.body && (isBodyClamped || bodyExpanded);

  const toggleBody = () => {
    const el = bodyRef.current;
    if (!el) return;
    clearTimeout(bodyTimerRef.current);
    onBodyExpandedChange?.(!bodyExpanded); // 높이가 바뀌기 전에 알려야 부모가 이웃 카드의 원래 높이를 잴 수 있음
    // 접힌 높이 = 줄 높이 × 3 (leading-relaxed라 계산된 line-height는 px 값)
    const collapsedPx = parseFloat(getComputedStyle(el).lineHeight) * 3;
    // 시작 높이를 먼저 px로 박은 뒤 다음 프레임에 목표 높이로 바꿔야 CSS transition이 동작함
    const animateTo = (from: number, to: number) => {
      setBodyMaxHeight(from);
      requestAnimationFrame(() => requestAnimationFrame(() => setBodyMaxHeight(to)));
    };
    if (!bodyExpanded) {
      setBodyExpanded(true);
      setIsClampApplied(false);
      animateTo(collapsedPx, el.scrollHeight);
      bodyTimerRef.current = setTimeout(() => setBodyMaxHeight(null), BODY_TOGGLE_MS); // 끝나면 제한 해제(내용이 바뀌어도 자유롭게 커지게)
    } else {
      setBodyExpanded(false);
      animateTo(el.scrollHeight, collapsedPx);
      bodyTimerRef.current = setTimeout(() => {
        setIsClampApplied(true); // 다 접힌 뒤에 말줄임표를 다시 켬
        setBodyMaxHeight(null);
      }, BODY_TOGGLE_MS);
    }
  };
  // 이모지 선택창 열림 상태 — 부모가 pickerOpenProp/onPickerOpenChange를 넘기면 부모가 제어(여러 카드 중 하나만 열리게),
  // 안 넘기면 카드 안에서 혼자 관리
  const [localPickerOpen, setLocalPickerOpen] = useState(false);
  const isPickerControlled = pickerOpenProp !== undefined;
  const pickerOpen = isPickerControlled ? pickerOpenProp : localPickerOpen;
  const setPickerOpen = (open: boolean) => {
    if (!isPickerControlled) setLocalPickerOpen(open);
    onPickerOpenChange?.(open);
  };
  const [reactions, setReactions] = useState<ReactionState>(() => toReactionState(post.reactions));
  const [liked, setLiked] = useState(post.isLiked ?? false);
  const report = useSongReport();
  const likeToast = useLikeToast();
  const share = useShareModal({ trackId: post.trackId, title: post.title, artist: post.artist, albumArtUrl: post.albumArtUrl });
  const { toggleLike, toggleReactionMutation } = usePostInteractionMutations();

  const handleAlbumArtPlay = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    onPlay?.();
  };

  // 먼저 로컬 카운트를 낙관적으로 증감시켜 바로 반응이 보이게 하고(서버가 내려준 count엔 이미 내 반응이
  // 포함돼 있어 +1/-1로 계산), 서버 응답이 오면 그 곡의 반응 전체 최신 값으로 통째로 맞춤.
  // 실패하면 원래 상태로 되돌림. post.id가 없는(아직 더미인) 게시글은 API 호출 없이 로컬로만 토글.
  // 이전 요청이 아직 처리 중이면 연타를 무시 — 여러 요청이 동시에 나가면 응답 도착 순서가
  // 클릭 순서와 안 맞아서 최종 상태가 서버 상태와 어긋날 수 있음
  const toggleReaction = (key: ReactionKey) => {
    if (toggleReactionMutation.isPending) return;
    const previous = reactions;
    setReactions((prev) => nextOptimisticReaction(prev, key));

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
  // 좋아요 API는 게시글 id가 아니라 trackId 기준이라, 게시글 id가 없어도(저장한 곡 목록처럼 곡 단위로 내려오는 경우) 호출해야 함
  const toggleLiked = () => {
    const optimistic = !liked;
    setLiked(optimistic);
    likeToast.show(optimistic);
    toggleLike.mutate(post.trackId, {
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

  // 곡명·가수명을 누르면 이 곡의 게시글 모음(TrackPostCollectionView)으로 이동 — 카드 전체 클릭(onSelect)과
  // 별개 동작이라 전파를 막음. 단, 카드 자체가 이미 onSelect로 클릭 가능한 요약 목록(2열)에서는
  // 카드 전체가 게시글 상세로 가는 단일 탭 영역이어야 해서 제목만 따로 분리하지 않음
  const showTrackLink = !!onSelectTrack && !onSelect;
  // trailingAction='trackLink'면 더보기 자리에 > 버튼을 둠 — 이동할 곳(onSelectTrack)이 없으면 기본 더보기로 되돌림
  const useTrackLinkButton = trailingAction === 'trackLink' && !!onSelectTrack;
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
        {showTrackLink && !useTrackLinkButton && <ChevronRight size={16} className="flex-shrink-0 text-text-sub" />}
      </div>
      <div className="text-xs font-medium text-text-sub truncate">{post.artist}</div>
    </div>
  ) : (
    <div className={`flex items-center gap-0.5 min-w-0 ${showTrackLink ? 'cursor-pointer' : ''}`} {...titleInteractiveProps}>
      <span className="truncate min-w-0">
        {/* 폭이 좁은 2열(narrow)은 한 단계 작게 — 제목 sm / 가수 xs (1열은 base / sm) */}
        <span className={`${isNarrow ? 'text-sm' : 'text-base'} font-bold text-text-main`}>{post.title}</span>
        <span className={`${isNarrow ? 'text-xs' : 'text-sm'} font-medium text-text-sub`}> · {post.artist}</span>
      </span>
      {showTrackLink && !useTrackLinkButton && <ChevronRight size={19} className="flex-shrink-0 text-text-sub" />}
    </div>
  );

  // 더보기 버튼: 앨범 커버 바로 아래 첫 행의 맨 오른쪽에 위치 —
  // 1열(리액션 있음)에서는 리액션 행, 2열(리액션 숨김)에서는 제목 행에 합류
  const moreButton = <PostMoreMenu report={report} menuKey="more" reportTargetId={post.id} />;
  // 같은 자리에 들어가는 우측 버튼 — 'trackLink'면 > 버튼(내 글 여부와 무관하게 이동은 항상 가능),
  // 아니면 더보기(신고는 내 글에는 숨김)
  const trailingButton = useTrackLinkButton ? (
    <button
      onClick={handleSelectTrackClick}
      aria-label={`${post.title} 게시글 모음 보기`}
      className="flex-shrink-0 active:scale-90 transition-transform"
    >
      <ChevronRight size={20} className="text-text-sub" />
    </button>
  ) : (
    !post.isMine && moreButton
  );

  // 공유/좋아요 배지 크기 — 1열은 36px, 2열(좁은 요약 카드)은 그보다 더 작게(28px).
  // offset은 "공유 버튼 폭 + 간격(10px)" 고정값 — 공유가 모서리(right-[4%]), 좋아요가 그 왼쪽
  const actionBadgeSizeClass = isNarrow ? 'w-7' : 'w-9';
  const likeBadgeRightClass = isNarrow ? 'right-[calc(4%_+_38px)]' : 'right-[calc(4%_+_46px)]';
  // 2열(좁은 카드)의 재생 버튼은 카드 폭 자체가 좁아서 같은 16%라도 절대 크기가 작아 보임 — 더 큰 비율로 보정
  const playButtonSizeClass = isNarrow ? 'w-[22%]' : 'w-[16%]';

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
      className={`flex flex-col bg-white rounded-2xl border border-slate-200 ${pickerOpen ? 'relative z-20' : 'overflow-hidden'} shadow-[0_10px_25px_-5px_rgba(0,0,0,0.03),0_8px_10px_-6px_rgba(0,0,0,0.03)] ${onSelect ? 'cursor-pointer' : ''} ${className}`}
    >
      {/* 앨범 커버 */}
      <div className="relative">
        <img
          src={post.albumArtUrl}
          alt={post.title}
          // rounded-t: 이모지 선택창이 열려 있는 동안엔 카드의 overflow-hidden을 풀어서(선택창이 카드 밖으로 나가도록) 커버 모서리를 직접 둥글게 유지
          className="w-full aspect-square object-cover bg-slate-100 rounded-t-[15px]"
        />

        {onPlay && !isTestPlayButton && (
          // control: 버튼 히트 영역을 앨범커버 전체가 아니라 눈에 보이는 원(카드 폭 대비 %)만큼만 잡아서,
          // 그 바깥을 누르면 카드 자체의 onSelect(상세로 전환/게시글 보기)로 넘어가게 함
          <AlbumArtPlayButton onPlay={onPlay} label={`${post.title} 재생`} sizeClass={playButtonSizeClass} isPlaying={isPlaying} />
        )}

        {onPlay && playButtonVariant === 'control' && (
          // control(1열·2열 공통): 가운데 원형 버튼의 모양은 그대로 두되, 앨범커버 어디를 눌러도
          // 재생/일시정지되도록 터치 영역만 커버 전체로 넓힘 — 위 원형 버튼 위에 투명 버튼을 덮어서 같은 동작을 함.
          // 2열에서도 커버를 누르면 카드의 onSelect(1열 상세로 전환)가 아니라 재생이 됨(전환은 커버 아래 텍스트 영역을 눌러서)
          <button
            onClick={handleAlbumArtPlay}
            aria-label={isPlaying ? `${post.title} 일시정지` : `${post.title} 재생`}
            className="absolute inset-0 z-[1] cursor-pointer"
          />
        )}

        {onPlay && isTestPlayButton && (
          // test: 앨범커버 전체가 재생 버튼 — 눌리는 순간 카드 자체의 onSelect로는 전파되지 않게 막음
          <button
            onClick={handleAlbumArtPlay}
            aria-label={isPlaying ? `${post.title} 일시정지` : `${post.title} 재생`}
            className="absolute inset-0 z-[1] cursor-pointer"
          />
        )}

        {onPlay && isTestPlayButton && (
          // test: 재생 가능함을 바로 알 수 있도록 우측 상단에 작게 표시. 앨범커버 어느 곳을 눌러도 같은 토글 동작
          <button
            onClick={handleAlbumArtPlay}
            aria-label={isPlaying ? `${post.title} 일시정지` : `${post.title} 재생`}
            className={`absolute top-[4%] right-[4%] z-10 ${isNarrow ? 'w-10' : 'w-14'} aspect-square rounded-full bg-white/30 backdrop-blur-md border border-white/40 flex items-center justify-center shadow-md active:scale-95 transition-transform`}
          >
            {isPlaying ? (
              <Pause className="w-1/2 h-1/2 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.45)]" fill="white" stroke="white" strokeWidth={1} />
            ) : (
              <Play className="w-1/2 h-1/2 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.45)]" fill="white" stroke="white" strokeWidth={1} />
            )}
          </button>
        )}

        {showMineBadge && (
          // "내 추천" 뱃지 — 1열·2열 공통으로 앨범커버 우상단. 공유/좋아요/재생 배지와 같은 글래스 스타일(글자와 테두리 사이 여백이 커 보여서 높이는 버튼보다 낮게).
          // 누르는 버튼이 아니라 표시일 뿐이라 pointer-events-none. A/B 테스트 재생 버튼(test)이 같은 자리에 있으면 그 왼쪽으로 비켜 앉음
          <span
            className={`absolute top-[4%] z-10 ${isNarrow ? 'h-5 px-2 text-[10px]' : 'h-6 px-2.5 text-[11px]'} rounded-full bg-white/30 backdrop-blur-md border border-white/40 flex items-center justify-center shadow-md font-semibold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.45)] pointer-events-none ${
              onPlay && isTestPlayButton ? (isNarrow ? 'right-[calc(4%_+_48px)]' : 'right-[calc(4%_+_64px)]') : 'right-[4%]'
            }`}
          >
            내 추천
          </span>
        )}

        {/* 앨범커버 우측 하단 공유하기/좋아요 배지 — 둘 다 "곡에 대한 액션"이라 한 코너에 나란히 묶어서
            서로 멀리 떨어져 있어 공유 버튼을 놓치는 일이 없게 함. 좋아요는 본인 게시글에서도 누를 수 있음. 공유 클릭 동작(카카오톡/링크 공유 시트)은 다음 단계에서 연결
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

        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleLiked();
          }}
          aria-label="좋아요"
          className={`absolute bottom-[4%] z-10 ${actionBadgeSizeClass} aspect-square rounded-full bg-white/30 backdrop-blur-md border border-white/40 flex items-center justify-center shadow-md active:scale-95 transition-transform ${likeBadgeRightClass}`}
        >
          <Heart className="w-1/2 h-1/2 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.45)]" strokeWidth={2} fill={liked ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* pickerAnchor가 있으면 relative — 이모지 선택창이 이 영역(카드 폭 전체)의 왼쪽/오른쪽 끝을 기준으로 뜸(EmojiReactionBar pickerAnchor 참고) */}
      {/* 2열(narrow) 카드는 하단 영역 어디를 눌러도 한마디 더보기/접기와 같은 동작 — 예전엔 1열 상세로 전환됐음.
          한마디가 안 잘렸으면(토글 버튼이 없으면) 눌러도 아무 일 없음. 안의 버튼들은 각자 stopPropagation으로 이 동작과 분리돼 있음 */}
      <div
        onClick={canToggleBody ? toggleBody : undefined}
        className={`${isNarrow ? 'px-3 pt-2 pb-2' : `px-4 pt-3 ${compact ? 'pb-3' : 'pb-4'}`} flex-1 flex flex-col ${pickerAnchor ? 'relative' : ''} ${canToggleBody ? 'cursor-pointer' : ''}`}
      >
        {!hideReactions && (
          <div className={`flex items-center gap-1.5 ${isNarrow ? 'mb-1' : 'mb-2'}`}>
            <EmojiReactionBar
              reactions={reactions}
              onToggleReaction={toggleReaction}
              disabled={toggleReactionMutation.isPending}
              pickerOpen={pickerOpen}
              onTogglePicker={() => setPickerOpen(!pickerOpen)}
              className="flex-1 min-w-0"
              pickerAnchor={pickerAnchor}
              size={isNarrow ? 'mini' : 'default'}
            />

            {trailingButton}
          </div>
        )}

        <div className={`${compact ? '' : 'mb-1'} ${hideReactions ? 'flex items-center gap-2' : ''}`}>
          <div className={hideReactions ? 'flex-1 min-w-0' : ''}>{titleBlock}</div>
          {hideReactions && trailingButton}
        </div>

        {/* 본문 */}
        {!compact && post.body && (
          <>
            <p
              ref={bodyRef}
              style={bodyMaxHeight !== null ? { maxHeight: bodyMaxHeight } : undefined}
              className={`${
                isNarrow
                  ? `text-xs overflow-hidden transition-[max-height] duration-300 ease-out motion-reduce:transition-none ${isClampApplied ? 'line-clamp-3' : ''}`
                  : 'text-sm'
              } text-text-main leading-relaxed ${
                isNarrow && (isBodyClamped || bodyExpanded) ? 'mb-1' : 'mb-2'
              } whitespace-pre-line`}
            >
              <span className="mr-[1px]">"</span>
              {post.body}
              <span className="ml-[1px]">"</span>
            </p>
            {/* 더보기/접기 — 카드 전체 클릭(1열 상세로 전환)과 별개 동작이라 전파를 막음 */}
            {canToggleBody && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleBody();
                }}
                aria-expanded={bodyExpanded}
                className="self-start mb-2 text-[11px] font-semibold text-text-hint active:opacity-60"
              >
                {bodyExpanded ? '접기' : '더보기'}
              </button>
            )}
          </>
        )}

        {/* 구분선 + 장르(최대 3개) — 묶어서 mt-auto로 카드 하단에 고정. 구분선을 장르 행과
            분리해두면 2열 그리드에서 카드 높이가 늘어날 때(본문이 짧은 카드) 구분선만 본문
            바로 아래 뜨고 장르는 저 밑에 떨어져 보였어서, 항상 장르 바로 위에 붙도록 묶음 */}
        {!compact && (
        <div className="mt-auto">
          <div className="border-t border-slate-100 mb-3" />
          <div className="flex items-center justify-between gap-2">
            <div className={`flex flex-wrap items-center gap-x-1 gap-y-1 ${isNarrow ? 'text-[11px]' : 'text-xs'} font-medium text-text-sub`}>
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
              <span className={`flex-shrink-0 ${isNarrow ? 'text-[11px]' : 'text-xs'} text-text-hint`}>{formatTimeAgo(post.createdAt)}</span>
            )}
          </div>
        </div>
        )}
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

      {likeToast.node}

      {share.node}
    </div>
  );
}
