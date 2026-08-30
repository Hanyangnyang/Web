import { Bookmark, MoreVertical, Play, Smile } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { type Song, type PlaylistReaction, GENRES, formatTimeAgo } from './playlistTypes';
import { type ReactionKey, EMOJI_REACTIONS } from './postReactions';
import { useReportSong } from '../../hooks/useRecentSongs.js';

export interface PostDetailCardData {
  // 신고하기 등 서버에 곡 id가 필요한 액션에 씀 — 실제 API 연동 전 더미 게시글엔 없을 수 있어서 옵셔널
  id?: string;
  albumArtUrl: string;
  title: string;
  artist: string;
  body: string;
  genres: string[];
  createdAt: Date | string;
  // 서버가 계산해서 내려주는 "지금 이 기기가 북마크했는지" 여부 — 없으면 false로 시작
  isBookmarked?: boolean;
  // 서버가 내려주는 이모지별 반응 수 + 내 반응 여부 — 없으면 반응 0개로 시작
  reactions?: PlaylistReaction[];
}

const REPORT_REASONS = ['부적절하거나 선정적인 표현', '욕설·비속어 포함', '스팸/광고성 게시글', '기타'];

interface PostDetailCardProps {
  post: PostDetailCardData;
  className?: string;
  // 넘겨줄 때만 앨범커버 중앙에 재생 버튼이 뜸
  onPlay?: () => void;
  // 지금 이 곡이 하단 플레이어에서 재생 중인지 — true면 재생 버튼을 숨김
  isPlaying?: boolean;
  // true면 이모지 리액션을 숨김 — 빠르게 훑어보는 요약 목록(2열)용
  hideReactions?: boolean;
  // true면 더보기(신고하기) 버튼을 숨김 — 본인이 등록한 곡 목록처럼 자기 자신을 신고할 수 없는 화면용
  hideMoreButton?: boolean;
  // 넘겨주면 카드 전체가 클릭 가능해짐 — 요약 목록(2열)에서 눌러 상세(1열)로 전환할 때 사용
  onSelect?: () => void;
}

// 리스트/캐러셀에서 쓰는 Song 엔티티를 PostDetailCard가 받는 형태로 변환 (본문=comment)
export function songToPostDetailCardData(song: Song): PostDetailCardData {
  return {
    id: song.id,
    albumArtUrl: song.albumArtUrl,
    title: song.title,
    artist: song.artist,
    body: song.comment,
    genres: song.genres,
    createdAt: song.createdAt,
    isBookmarked: song.isBookmarked,
    reactions: song.reactions,
  };
}

type ReactionState = Partial<Record<ReactionKey, { count: number; mine: boolean }>>;

// 서버가 내려준 반응 목록을 이모지 키 기준 상태로 변환 — reaction.type이 ReactionKey와 동일한 문자열이라는 전제(예: 'FIRE')
function toReactionState(reactions?: PlaylistReaction[]): ReactionState {
  const state: ReactionState = {};
  for (const r of reactions ?? []) {
    state[r.type as ReactionKey] = { count: r.count, mine: r.isReacted };
  }
  return state;
}

// 인스타그램 게시물처럼 앨범커버와 하단 콘텐츠가 하나의 카드로 이어지는 게시글 조회 카드. PostDetailView에서 사용
export function PostDetailCard({
  post,
  className = '',
  onPlay,
  isPlaying = false,
  hideReactions = false,
  hideMoreButton = false,
  onSelect,
}: PostDetailCardProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [reactions, setReactions] = useState<ReactionState>(() => toReactionState(post.reactions));
  const [reportMenuOpen, setReportMenuOpen] = useState(false);
  const [reportReasonPopupOpen, setReportReasonPopupOpen] = useState(false);
  const [selectedReportReason, setSelectedReportReason] = useState<string | null>(null);
  const [reportToast, setReportToast] = useState('');
  const [bookmarked, setBookmarked] = useState(post.isBookmarked ?? false);
  const reportMenuRef = useRef<HTMLDivElement>(null);
  const reportSong = useReportSong();

  // 신고하기 드롭다운이 열려있을 때, 버튼/드롭다운 바깥을 누르면 닫음
  useEffect(() => {
    if (!reportMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (reportMenuRef.current && !reportMenuRef.current.contains(e.target as Node)) {
        setReportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [reportMenuOpen]);

  // 실제 반응 등록 API가 아직 없어서 로컬 카운트만 낙관적으로 증감 (서버가 내려준 count엔 이미 내 반응이 포함돼 있음)
  const toggleReaction = (key: ReactionKey) => {
    setReactions((prev) => {
      const current = prev[key] ?? { count: 0, mine: false };
      const mine = !current.mine;
      const count = Math.max(0, current.count + (mine ? 1 : -1));
      return { ...prev, [key]: { count, mine } };
    });
  };

  const toggleBookmarked = () => setBookmarked((prev) => !prev);

  const handleConfirmReport = () => {
    if (!post.id || !selectedReportReason) return;
    reportSong.mutate(
      { songId: post.id, reason: selectedReportReason },
      {
        onSuccess: () => {
          setReportReasonPopupOpen(false);
          setSelectedReportReason(null);
          setReportToast('신고가 접수됐어요. 검토 후 조치할게요.');
          setTimeout(() => setReportToast(''), 2000);
        },
      }
    );
  };

  // count가 0보다 큰 이모지만 표시
  const displayedReactions = EMOJI_REACTIONS.filter(({ key }) => (reactions[key]?.count ?? 0) > 0);

  const titleBlock = (
    <div className="truncate">
      <span className="text-base font-bold text-text-main">{post.title}</span>
      <span className="text-sm font-medium text-text-sub"> · {post.artist}</span>
    </div>
  );

  // 더보기 버튼: 앨범 커버 바로 아래 첫 행의 맨 오른쪽에 위치 —
  // 1열(리액션 있음)에서는 리액션 행, 2열(리액션 숨김)에서는 제목 행에 합류
  const moreButton = (
    <div ref={reportMenuRef} className="relative inline-block flex-shrink-0">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setReportMenuOpen((prev) => !prev);
        }}
        aria-label="더보기"
        className="active:scale-90 transition-transform"
      >
        <MoreVertical size={18} className="text-text-sub" />
      </button>

      {reportMenuOpen && (
        <div className="absolute top-full right-0 mt-0.5 z-20 bg-white border border-slate-200 rounded-xl shadow-[0_10px_25px_-5px_rgba(0,0,0,0.15)] overflow-hidden">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setReportMenuOpen(false);
              setReportReasonPopupOpen(true);
            }}
            className="block w-full px-4 py-2.5 text-left text-sm font-semibold text-red-500 hover:bg-slate-50 whitespace-nowrap"
          >
            신고하기
          </button>
        </div>
      )}
    </div>
  );

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
      className={`bg-white rounded-2xl border border-slate-200 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.03),0_8px_10px_-6px_rgba(0,0,0,0.03)] overflow-hidden ${onSelect ? 'cursor-pointer' : ''} ${className}`}
    >
      {/* 앨범 커버 */}
      <div className="relative">
        <img
          src={post.albumArtUrl}
          alt={post.title}
          className="w-full aspect-square object-cover bg-slate-100"
        />

        {onPlay && !isPlaying && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPlay();
            }}
            aria-label={`${post.title} 재생`}
            className="absolute inset-0 flex items-center justify-center active:scale-95 transition-transform"
          >
            {/* 버튼/아이콘을 카드 폭 대비 %로 지정해서 2열이든 1열이든 항상 같은 비율로 보이게 함 */}
            <span className="w-[16%] aspect-square rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center">
              <Play className="w-1/2 h-1/2 text-white" fill="white" stroke="white" strokeWidth={1} />
            </span>
          </button>
        )}

        {/* 앨범커버 우측 하단 북마크 배지 — 1열/2열 공통, 크기를 카드 폭 대비 %로 지정해서 항상 같은 비율로 보이게 함 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleBookmarked();
          }}
          aria-label="북마크"
          className="absolute bottom-[4%] right-[4%] z-10 w-[min(16%,32px)] aspect-square rounded-full bg-white/25 backdrop-blur-md border border-white/40 flex items-center justify-center shadow-md active:scale-95 transition-transform"
        >
          <Bookmark className={`w-1/2 h-1/2 ${bookmarked ? 'text-primary' : 'text-white'}`} strokeWidth={2} fill={bookmarked ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="px-4 pt-3 pb-4">
        {!hideReactions && (
          <div className="flex items-center gap-1.5 mb-2">
            {/* 이모지 추가 버튼 — 스크롤 영역 밖에 고정, 위로 뜨는 팝오버가 잘리지 않게 함 */}
            <div className="relative inline-block flex-shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setPickerOpen((prev) => !prev);
                }}
                aria-label="이모지 추가"
                className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center active:scale-90 transition-transform"
              >
                <Smile size={13} className="text-text-sub" strokeWidth={2} />
              </button>

              {pickerOpen && (
                <div className="absolute bottom-full left-0 mb-2 z-10">
                  <div className="flex gap-1 px-2 py-1.5 bg-white border border-slate-200 rounded-full shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)]">
                    {EMOJI_REACTIONS.map(({ key, emoji }) => (
                      <button
                        key={key}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleReaction(key);
                          setPickerOpen(false);
                        }}
                        aria-label={`${emoji} 남기기`}
                        className="w-6 h-6 flex items-center justify-center text-xs rounded-full hover:bg-slate-100 active:scale-90 transition-transform"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                  {/* 말풍선 꼬리 */}
                  <div className="w-2.5 h-2.5 bg-white border-r border-b border-slate-200 rotate-45 ml-3 -mt-1.5" />
                </div>
              )}
            </div>

            {/* 이미 달린 리액션 칩 — 9종까지 늘어날 수 있어서 가로 스크롤 */}
            <div
              className="flex items-center gap-1.5 flex-1 min-w-0 overflow-x-auto [&::-webkit-scrollbar]:hidden"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {displayedReactions.map(({ key, emoji }) => {
                const { count, mine } = reactions[key] ?? { count: 0, mine: false };
                return (
                  <button
                    key={key}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleReaction(key);
                    }}
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

            {!hideMoreButton && moreButton}
          </div>
        )}

        <div className={`mb-2 ${hideReactions ? 'flex items-center gap-2' : ''}`}>
          <div className={hideReactions ? 'flex-1 min-w-0' : ''}>{titleBlock}</div>
          {hideReactions && !hideMoreButton && moreButton}
        </div>

        {/* 본문 */}
        <p className="text-sm text-text-main leading-relaxed mb-3 whitespace-pre-line">{post.body}</p>

        {/* 장르 — 최대 3개까지 함께 표시. 시간은 1열(리액션 있는) 모드에서만 카드 우측 끝에 같이 표시 */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-text-sub">
            {post.genres.map((label) => {
              const genre = GENRES.find((g) => g.label === label);
              return (
                <span key={label} className="flex items-center">
                  {genre?.emoji && <span>{genre.emoji}</span>}
                  <span>{label}</span>
                </span>
              );
            })}
          </div>
          {!hideReactions && (
            <span className="flex-shrink-0 text-xs text-text-hint">{formatTimeAgo(post.createdAt)}</span>
          )}
        </div>
      </div>

      {/* 신고 사유 선택 팝업 */}
      {reportReasonPopupOpen && (
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
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium border transition-colors active:scale-[0.98] ${
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
              <p className="text-xs text-red-500 text-center mb-3">
                신고 접수에 실패했어요. 다시 시도해주세요.
              </p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setReportReasonPopupOpen(false);
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
                  selectedReportReason && !reportSong.isPending
                    ? 'text-white bg-red-500'
                    : 'text-slate-300 bg-slate-100'
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
    </div>
  );
}
