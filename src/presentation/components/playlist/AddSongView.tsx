import { Loader2, Play, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { MiscSubViewHeader } from '../misc/MiscSubViewHeader';
import { GENRES } from './playlistTypes';
import { type PlayableTrack } from './FloatingSpotifyPlayer';
import { useSubmitSong, useSongCreationStatus } from '../../hooks/useRecentSongs.js';
import { useBackHandler } from '../../hooks/useBackHandler.js';
import { type HttpError } from '../../../infrastructure/http/HttpClient.js';

interface SearchTrack {
  trackId: string;
  title: string;
  artist: string;
  albumArtUrl: string;
}

// 뒤로가기 시 임시저장한 곡추천하기 초안 — 기기(브라우저)당 1개만 유지
const DRAFT_STORAGE_KEY = 'hyu_add_song_draft_v1';

interface AddSongDraft {
  track: SearchTrack | null;
  selectedGenres: string[];
  comment: string;
}

function loadDraft(): AddSongDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AddSongDraft) : null;
  } catch {
    return null;
  }
}

function saveDraft(draft: AddSongDraft) {
  try {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // 시크릿 모드 등 localStorage 접근 불가 시 임시저장은 부가 기능이라 조용히 무시
  }
}

function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch {
    // 위와 동일
  }
}

const COMMENT_MAX_LENGTH = 200;
const SEARCH_COOLDOWN_MS = 600;
const MIN_QUERY_LENGTH = 2;
const MIN_GENRES = 1;
const MAX_GENRES = 3;

const GENRE_OPTIONS = GENRES.filter((genre) => genre.key !== 'all');

// 곡 등록 실패 에러 코드별 클라이언트 대응 (API 문서의 "곡 추천 등록 규칙"/"AI 모더레이션 검열" 그대로)
// PL001·PL002: 토스트 노출 / PL003·C001: 문구 노출 및 수정 유도(폼 하단 인라인) / C004(500): 재시도 유도 팝업
const TOAST_ERROR_MESSAGES: Record<string, string> = {
  PL001: '오늘 추천 가능한 3곡을 모두 작성하셨어요! 내일 다시 참여해주세요.',
  PL002: '최근 7일 이내에 이미 추천하신 곡이에요. 다른 곡을 추천해주세요!',
};
const INLINE_ERROR_MESSAGES: Record<string, string> = {
  PL003: '부적절하거나 비속어가 포함된 코멘트는 등록할 수 없어요.',
  C001: '장르는 최소 1개, 최대 3개까지 선택하고 코멘트는 200자 이내로 입력해주세요.',
};
const RETRY_ERROR_CODE = 'C004';

function normalizeQuery(query: string): string {
  return query.trim().replace(/\s+/g, ' ');
}

class SearchApiError extends Error {
  status: number;
  retryAfterSeconds?: number;

  constructor(message: string, status: number, retryAfterSeconds?: number) {
    super(message);
    this.status = status;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

async function searchTracks(query: string): Promise<SearchTrack[]> {
  const normalized = normalizeQuery(query);
  const response = await fetch(`/api/music-search?q=${encodeURIComponent(normalized)}`);
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const retryAfterHeader = response.headers.get('Retry-After');
    throw new SearchApiError(
      body?.error || '검색 중 문제가 생겼어요. 다시 시도해주세요.',
      response.status,
      retryAfterHeader ? Number(retryAfterHeader) : undefined
    );
  }
  const data = await response.json();
  return data.tracks as SearchTrack[];
}

interface AddSongViewProps {
  onBack: () => void;
  // 플레이어가 떠 있으면 등록하기 버튼이 그 위로 뜨도록 — 0이면 플레이어 닫힘
  playerHeight?: number;
  // 선택한 곡을 미리 들어볼 수 있게 하단 플레이어를 띄우는 콜백
  onPlay?: (track: PlayableTrack) => void;
  // 지금 하단 플레이어에서 재생 중인 곡 — 선택한 곡과 같으면 재생 버튼을 숨김
  currentTrackId?: string | null;
}

// 플레이어 카드 위 16px 간격을 두고 뜨도록 — AddSongFab과 동일한 값
const PLAYER_GAP = 16;
// 등록하기 버튼 자체의 높이(h-12)와, 그 위 마지막 섹션(곡에 대한 한마디)이 버튼에 가리지 않도록 두는 여유 간격
const REGISTER_BUTTON_HEIGHT = 48;
const REGISTER_BUTTON_CLEARANCE_GAP = 16;

export function AddSongView({ onBack, playerHeight = 0, onPlay, currentTrackId }: AddSongViewProps) {
  // 화면 진입 시 임시저장된 초안이 있으면 한 번만 불러와서 초기값으로 씀
  const [initialDraft] = useState(() => loadDraft());
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchTrack[]>([]);
  const [searchErrorMessage, setSearchErrorMessage] = useState<string | null>(null);
  const [retryBlockedUntil, setRetryBlockedUntil] = useState(0);
  const [selectedTrack, setSelectedTrack] = useState<SearchTrack | null>(initialDraft?.track ?? null);
  const [selectedGenres, setSelectedGenres] = useState<string[]>(initialDraft?.selectedGenres ?? []);
  const [comment, setComment] = useState(initialDraft?.comment ?? '');
  const [draftRestoredToast, setDraftRestoredToast] = useState(initialDraft ? '작성 중이던 내용을 불러왔어요' : '');
  const [submitToast, setSubmitToast] = useState('');
  const [submitInlineError, setSubmitInlineError] = useState<string | null>(null);
  const [showSubmitRetryPopup, setShowSubmitRetryPopup] = useState(false);
  const [showRegisterNoticePopup, setShowRegisterNoticePopup] = useState(false);
  const [showLeaveConfirmPopup, setShowLeaveConfirmPopup] = useState(false);
  const submitSong = useSubmitSong();
  const { data: creationStatus } = useSongCreationStatus();
  const recentlyRecommendedTrackIds = new Set(creationStatus?.recentTrackIdsIn7Days ?? []);

  useEffect(() => {
    if (!draftRestoredToast) return;
    const timer = setTimeout(() => setDraftRestoredToast(''), 2500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 마운트 시 초안 복원 여부만 한 번 확인하면 됨
  }, []);

  // 곡/장르/코멘트 중 하나라도 채워져 있으면 뒤로가기 시 확인 팝업을 거침
  const hasUnsavedContent = !!selectedTrack || selectedGenres.length > 0 || comment.trim().length > 0;

  // 안드로이드 하드웨어 뒤로가기 — 확인 팝업이 떠 있으면 팝업만 닫고, 저장 안 한 내용이 있으면 팝업을 띄움
  const handleBackRequest = () => {
    if (showLeaveConfirmPopup) {
      setShowLeaveConfirmPopup(false);
      return;
    }
    if (hasUnsavedContent) {
      setShowLeaveConfirmPopup(true);
      return;
    }
    onBack();
  };
  useBackHandler(handleBackRequest);

  const lastSearchAtRef = useRef(0);

  const handleSearchClick = () => {
    if (query.trim().length < MIN_QUERY_LENGTH) {
      setSelectedTrack(null);
      setSearchResults([]);
      setSearchErrorMessage(`최소 ${MIN_QUERY_LENGTH}자 이상 입력해주세요!`);
      setHasSearched(true);
      return;
    }

    const now = Date.now();
    if (now - lastSearchAtRef.current < SEARCH_COOLDOWN_MS) return;
    if (isSearching || retryBlockedUntil > 0) return;
    lastSearchAtRef.current = now;

    setIsSearching(true);
    setSearchErrorMessage(null);
    setSelectedTrack(null);
    searchTracks(query)
      .then((results) => {
        setSearchResults(results);
        setHasSearched(true);
      })
      .catch((error) => {
        console.error('[AddSongView] search failed:', error);
        setSearchResults([]);
        setHasSearched(true);
        setSearchErrorMessage(
          error instanceof SearchApiError ? error.message : '검색 중 문제가 생겼어요. 다시 시도해주세요'
        );

        if (error instanceof SearchApiError && error.retryAfterSeconds) {
          const jitterMs = Math.random() * 1000;
          const waitMs = error.retryAfterSeconds * 1000 + jitterMs;
          setRetryBlockedUntil(Date.now() + waitMs);
          setTimeout(() => setRetryBlockedUntil(0), waitMs);
        }
      })
      .finally(() => {
        setIsSearching(false);
      });
  };

  const isResultsPanelOpen = !selectedTrack && hasSearched && !isSearching;

  // 서버가 최종 판단하지만(PL001/PL002 토스트가 안전망), creation-status 값이 이미 있으면 미리 막아서
  // 어차피 실패할 요청을 보내지 않게 함. 아직 안 불러와졌으면(undefined) 막지 않고 그대로 진행
  const canSubmit =
    !!selectedTrack &&
    selectedGenres.length >= MIN_GENRES &&
    comment.trim().length > 0 &&
    creationStatus?.canCreate !== false &&
    !submitSong.isPending;

  const handleGenreClick = (key: string) => {
    setSelectedGenres((prev) => {
      if (prev.includes(key)) return prev.filter((g) => g !== key);
      if (prev.length >= MAX_GENRES) return prev;
      return [...prev, key];
    });
  };

  // 등록하기 버튼을 누르면 바로 제출하지 않고, 삭제·수정 불가/1일 3곡 제한을 먼저 안내하는 팝업을 거침
  const handleRegisterClick = () => {
    if (!canSubmit) return;
    setShowRegisterNoticePopup(true);
  };

  const submitSongNow = () => {
    if (!canSubmit || !selectedTrack) return;
    const genreLabels = selectedGenres.map((key) => GENRES.find((genre) => genre.key === key)?.label ?? key);

    setSubmitInlineError(null);

    submitSong.mutate(
      {
        trackId: selectedTrack.trackId,
        title: selectedTrack.title,
        artist: selectedTrack.artist,
        albumArtUrl: selectedTrack.albumArtUrl,
        comment: comment.trim(),
        genres: genreLabels,
      },
      {
        onSuccess: () => {
          clearDraft();
          onBack();
        },
        onError: (error) => {
          const code = (error as HttpError).code;

          if (code && TOAST_ERROR_MESSAGES[code]) {
            setSubmitToast(TOAST_ERROR_MESSAGES[code]);
            setTimeout(() => setSubmitToast(''), 2500);
            return;
          }

          if (code === RETRY_ERROR_CODE) {
            setShowSubmitRetryPopup(true);
            return;
          }

          setSubmitInlineError(
            (code && INLINE_ERROR_MESSAGES[code]) ||
              (error instanceof Error ? error.message : '곡 등록에 실패했어요. 다시 시도해주세요.')
          );
        },
      }
    );
  };

  // FAB는 이 화면에서 숨겨지고 등록하기 버튼만 떠 있어서, 공용 --playlist-bottom-space 대신
  // 이 버튼 자신의 높이+여백만큼만 마지막 섹션이 가려지지 않게 직접 계산
  const registerButtonClearance = REGISTER_BUTTON_HEIGHT + REGISTER_BUTTON_CLEARANCE_GAP;
  const contentBottomPadding =
    playerHeight > 0
      ? `calc(${playerHeight}px + ${PLAYER_GAP}px + ${registerButtonClearance}px + env(safe-area-inset-bottom))`
      : `calc(24px + ${registerButtonClearance}px + env(safe-area-inset-bottom))`;

  return (
    <div
      className="transition-[padding-bottom] duration-300 ease-out"
      style={{ paddingBottom: contentBottomPadding }}
    >
      <MiscSubViewHeader
        title="곡 추천하기"
        emoji="🤔"
        subtitle={
          creationStatus
            ? creationStatus.canCreate
              ? `오늘 ${creationStatus.remainingCount}곡 더 등록할 수 있어요 (${creationStatus.dailyCount}/${creationStatus.dailyMaxLimit})`
              : '오늘 등록 가능한 곡을 모두 채웠어요! 내일 다시 만나요'
            : ''
        }
        onBack={handleBackRequest}
      />

      {/* 1. 곡 검색 */}
      <section className="mb-5">
        <h3 className="text-lg font-bold text-text-main mb-2">곡 검색</h3>
        <div
          className={`bg-white border border-slate-200 shadow-[0_2px_4px_rgba(0,0,0,0.03)] focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(14,74,132,0.1)] transition-all ${
            isResultsPanelOpen ? 'rounded-t-card' : 'rounded-card'
          }`}
        >
          <div className="flex items-center gap-2 px-3.5 py-2.5">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearchClick();
              }}
              placeholder="곡 제목이나 아티스트를 검색해보세요"
              className="flex-1 bg-transparent text-sm text-text-main placeholder-text-hint outline-none"
            />
            <button
              onClick={handleSearchClick}
              disabled={isSearching || retryBlockedUntil > 0 || !query.trim()}
              aria-label="곡 검색"
              className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full text-primary disabled:text-text-hint hover:bg-primary/10 transition-colors active:scale-90"
            >
              {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            </button>
          </div>
        </div>

        {/* 검색 결과 — 검색창과 이어진 아코디언 패널 */}
        <div
          className={`grid transition-[grid-template-rows] duration-300 ease-out ${
            isResultsPanelOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
          }`}
        >
          <div className="overflow-hidden">
            <div className="bg-white border border-t-0 border-slate-200 rounded-b-card py-3">
              {searchResults.length > 0 ? (
                <div
                  className="flex gap-3 px-3 overflow-x-auto [&::-webkit-scrollbar]:hidden"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {searchResults.map((track) => {
                    // 최근 7일 이내에 이미 추천한 곡은 검색 결과에서 바로 골라내지 못하게 막음(어차피 서버가 PL002로 거절함)
                    const alreadyRecommended = recentlyRecommendedTrackIds.has(track.trackId);
                    return (
                      <div
                        key={track.trackId}
                        role="button"
                        tabIndex={alreadyRecommended ? -1 : 0}
                        onClick={() => {
                          if (!alreadyRecommended) setSelectedTrack(track);
                        }}
                        onKeyDown={(e) => {
                          if (alreadyRecommended) return;
                          if (e.key === 'Enter' || e.key === ' ') setSelectedTrack(track);
                        }}
                        aria-label={alreadyRecommended ? `${track.title} 최근 7일 내 이미 추천한 곡` : `${track.title} 선택`}
                        className={`flex-shrink-0 w-28 text-left transition-transform ${
                          alreadyRecommended ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer active:scale-[0.97]'
                        }`}
                      >
                        <div className="relative w-28 aspect-square rounded-lg overflow-hidden bg-slate-100">
                          <img
                            src={track.albumArtUrl}
                            alt={track.title}
                            className="w-full h-full object-cover"
                          />
                          {onPlay && (
                            // 앨범커버 전체가 아니라 눈에 보이는 원형 아이콘 크기만큼만 클릭 영역을 잡아서,
                            // 그 바깥(앨범커버 나머지 영역)을 누르면 카드 자체의 onClick(곡 선택)으로 넘어가게 함
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onPlay(track);
                              }}
                              aria-label={`${track.title} 재생`}
                              className="absolute inset-0 m-auto w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform"
                            >
                              <Play size={16} className="text-white" fill="white" />
                            </button>
                          )}
                        </div>
                        <div className="mt-1.5 text-sm font-semibold text-text-main truncate">{track.title}</div>
                        <div className="text-xs text-text-sub truncate">{track.artist}</div>
                        {alreadyRecommended && (
                          <div className="text-[10px] font-semibold text-red-400">최근 추천함</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-text-hint text-center px-3 min-h-[60px] flex items-center justify-center whitespace-pre-line">
                  {searchErrorMessage || '검색 결과가 없어요'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 선택된 곡 */}
        {selectedTrack && (
          <div className="mt-2 flex items-center gap-3 bg-white border border-primary/30 shadow-[0_2px_4px_rgba(0,0,0,0.03)] rounded-card px-3 py-2.5">
            <img
              src={selectedTrack.albumArtUrl}
              alt={selectedTrack.title}
              className="w-10 h-10 rounded object-cover flex-shrink-0 bg-slate-100"
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-text-main truncate">{selectedTrack.title}</div>
              <div className="text-xs text-text-sub truncate">{selectedTrack.artist}</div>
            </div>
            {onPlay && selectedTrack.trackId !== currentTrackId && (
              <button
                onClick={() => onPlay(selectedTrack)}
                aria-label={`${selectedTrack.title} 재생`}
                className="flex-shrink-0 p-1 hover:bg-slate-100 rounded-full transition-colors active:scale-90"
              >
                <Play size={16} className="text-text-sub" fill="currentColor" />
              </button>
            )}
            <button
              onClick={() => setSelectedTrack(null)}
              aria-label="선택한 곡 취소"
              className="flex-shrink-0 p-1 hover:bg-slate-100 rounded-full transition-colors active:scale-90"
            >
              <X size={16} className="text-text-sub" />
            </button>
          </div>
        )}
      </section>

      {/* 2. 장르 */}
      <section className="mb-5">
        <h3 className="text-lg font-bold text-text-main mb-2">장르</h3>
        <div className="bg-white border border-slate-200 rounded-card p-2 shadow-[0_2px_4px_rgba(0,0,0,0.03)] flex flex-wrap justify-center gap-2">
          {GENRE_OPTIONS.map((genre) => {
            const isSelected = selectedGenres.includes(genre.key);
            const isDisabled = !isSelected && selectedGenres.length >= MAX_GENRES;
            return (
              <button
                key={genre.key}
                onClick={() => handleGenreClick(genre.key)}
                disabled={isDisabled}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-bold border transition-all duration-200 active:scale-[0.96] ${
                  isSelected
                    ? `${genre.active} text-white border-transparent shadow-[0_2px_6px_rgba(14,74,132,0.25)]`
                    : isDisabled
                      ? 'bg-slate-100 text-slate-300 border-transparent'
                      : `${genre.light} text-gray-800 border-transparent`
                }`}
              >
                <span className="text-base">{genre.emoji}</span>
                <span>{genre.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. 곡에 대한 한마디 */}
      <section className="mb-5">
        <h3 className="text-lg font-bold text-text-main mb-2">곡에 대한 한마디</h3>
        <div className="bg-white border border-slate-200 rounded-card px-3.5 py-2.5 shadow-[0_2px_4px_rgba(0,0,0,0.03)] focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(14,74,132,0.1)] transition-all">
          <textarea
            value={comment}
            maxLength={COMMENT_MAX_LENGTH}
            onChange={(e) => setComment(e.target.value)}
            placeholder="이 곡에 대한 얘기를 자유롭게 남겨주세요!"
            rows={5}
            className="w-full bg-transparent text-sm text-text-main placeholder-text-hint outline-none resize-none"
          />
        </div>
        <div className="mt-1 text-right text-[11px] text-text-hint">
          {comment.length}/{COMMENT_MAX_LENGTH}
        </div>
      </section>

      {submitInlineError && (
        <p className="text-center text-xs text-red-500 mb-3 whitespace-pre-line">
          {submitInlineError}
        </p>
      )}

      {/* 등록하기 버튼 */}
      <button
        onClick={handleRegisterClick}
        disabled={!canSubmit}
        className={`fixed left-1/2 -translate-x-1/2 w-[calc(100%-4rem)] max-w-[360px] h-12 rounded-full text-sm font-bold border transition-all active:scale-[0.97] z-40 ${
          canSubmit
            ? 'bg-primary text-white border-transparent shadow-[0_6px_20px_rgba(14,74,132,0.35)]'
            : 'bg-slate-100 text-slate-300 border-transparent'
        }`}
        style={{
          bottom:
            playerHeight > 0
              ? `calc(${playerHeight}px + ${PLAYER_GAP}px + env(safe-area-inset-bottom))`
              : 'calc(24px + env(safe-area-inset-bottom))',
          transition: 'bottom 300ms ease-out',
        }}
      >
        {submitSong.isPending ? '등록 중...' : '등록하기'}
      </button>

      {/* 등록 요청 중 화면 전체를 잠가서 중복 탭/다른 조작을 막고, 진행 상태를 눈에 띄게 보여줌 */}
      {submitSong.isPending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="flex flex-col items-center gap-3 bg-white rounded-2xl shadow-xl px-8 py-6">
            <Loader2 size={28} className="animate-spin text-primary" />
            <p className="text-sm font-semibold text-text-main">등록 중이에요...</p>
          </div>
        </div>
      )}

      {/* 임시저장 초안을 복원했을 때 안내 토스트 */}
      {draftRestoredToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-[rgba(15,23,42,0.85)] text-white text-[0.78rem] font-medium px-4 py-2 rounded-full z-50 whitespace-pre-line text-center copy-toast">
          {draftRestoredToast}
        </div>
      )}

      {/* 1일 3곡 제한(PL001)/최근 7일 중복 추천(PL002) 안내 토스트 */}
      {submitToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-[rgba(15,23,42,0.85)] text-white text-[0.78rem] font-medium px-4 py-2 rounded-full z-50 whitespace-pre-line text-center copy-toast">
          {submitToast}
        </div>
      )}

      {/* 서버 일시 장애(C004) 재시도 유도 팝업 */}
      {showSubmitRetryPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-8">
          <div className="w-full max-w-[300px] bg-white rounded-2xl shadow-xl px-5 py-5 text-center">
            <p className="text-sm font-semibold text-text-main mb-1">일시적인 오류가 발생했어요</p>
            <p className="text-xs text-text-sub mb-4">잠시 후 다시 시도해주세요.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowSubmitRetryPopup(false)}
                className="flex-1 h-10 rounded-full text-sm font-bold text-text-sub bg-slate-100 active:scale-[0.97] transition-transform"
              >
                닫기
              </button>
              <button
                onClick={() => {
                  setShowSubmitRetryPopup(false);
                  submitSongNow();
                }}
                className="flex-1 h-10 rounded-full text-sm font-bold text-white bg-primary active:scale-[0.97] transition-transform"
              >
                다시 시도
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 등록 전 안내 — 삭제·수정 불가, 1일 3곡 제한 */}
      {showRegisterNoticePopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-8">
          <div className="w-full max-w-[300px] bg-white rounded-2xl shadow-xl px-5 py-5">
            <p className="text-sm font-semibold text-text-main mb-3 text-center">등록 전에 확인해주세요!</p>
            <ul className="text-xs text-text-sub mb-4 space-y-1.5 list-disc pl-4">
              <li>한 번 등록한 곡은 삭제하거나 수정할 수 없어요.</li>
              <li>
                하루에 최대 3곡까지만 등록할 수 있어요
                {creationStatus ? ` (오늘 ${creationStatus.remainingCount}곡 남음)` : ''}.
              </li>
            </ul>
            <div className="flex gap-2">
              <button
                onClick={() => setShowRegisterNoticePopup(false)}
                className="flex-1 h-10 rounded-full text-sm font-bold text-text-sub bg-slate-100 active:scale-[0.97] transition-transform"
              >
                취소
              </button>
              <button
                onClick={() => {
                  setShowRegisterNoticePopup(false);
                  submitSongNow();
                }}
                className="flex-1 h-10 rounded-full text-sm font-bold text-white bg-primary active:scale-[0.97] transition-transform"
              >
                등록하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 뒤로가기 시 작성 중인 내용이 있으면 확인 — 임시저장/저장 안 함/계속 작성 3가지 중 선택 */}
      {showLeaveConfirmPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-8">
          <div className="w-full max-w-[300px] bg-white rounded-2xl shadow-xl px-5 py-5">
            <p className="text-sm font-semibold text-text-main mb-1 text-center">작성 중인 내용이 있어요</p>
            <p className="text-xs text-text-sub mb-4 text-center">나가기 전에 어떻게 할까요?</p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  saveDraft({ track: selectedTrack, selectedGenres, comment });
                  setShowLeaveConfirmPopup(false);
                  onBack();
                }}
                className="h-10 rounded-full text-sm font-bold text-white bg-primary active:scale-[0.97] transition-transform"
              >
                임시저장하고 나가기
              </button>
              <button
                onClick={() => {
                  clearDraft();
                  setShowLeaveConfirmPopup(false);
                  onBack();
                }}
                className="h-10 rounded-full text-sm font-bold text-red-500 bg-red-50 active:scale-[0.97] transition-transform"
              >
                저장 안 하고 나가기
              </button>
              <button
                onClick={() => setShowLeaveConfirmPopup(false)}
                className="h-10 rounded-full text-sm font-bold text-text-sub bg-slate-100 active:scale-[0.97] transition-transform"
              >
                계속 작성하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
