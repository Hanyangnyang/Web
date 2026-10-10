import { ChevronDown, ChevronUp, Loader2, Pause, Play, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { usePostHog } from 'posthog-js/react';
import { MiscSubViewHeader } from '../../misc/MiscSubViewHeader';
import { GENRES, type TrackSummary } from '../playlistTypes';
import { type MusicSearchTrack } from '../../../../domain/entities/MusicSearchTrack.js';
import { type PlayableTrack } from '../shared/FloatingSpotifyPlayer';
import { MusicSearchResultCard } from '../shared/MusicSearchResultCard';
import { ConfirmPopup } from '../shared/ConfirmPopup';
import { Toast } from '../shared/Toast';
import { PlaylistFallback } from '../shared/PlaylistFallback';
import { ErrorBoundary } from '../../common/ErrorBoundary.js';
import { PLAYER_GAP_PX } from '../shared/AddSongFab';
import { useFirstRecommendNotice } from './useFirstRecommendNotice';
import { useSubmitSong } from '../../../hooks/playlist/useSubmitSong.js';
import { useSongCreationStatus } from '../../../hooks/playlist/useSongCreationStatus.js';
import { useMusicSearch, normalizeMusicSearchQuery } from '../../../hooks/playlist/useMusicSearch.js';
import { useRetryCountdown, getSearchErrorMessage } from '../../../hooks/playlist/useRetryCountdown.js';
import { formatBlockedUntil } from './formatBlockedUntil';
import { useBackHandler } from '../../../hooks/useBackHandler.js';
import { type HttpError } from '../../../../infrastructure/http/HttpClient.js';

type SearchTrack = TrackSummary;

const COMMENT_MAX_LENGTH = 200;
const SEARCH_COOLDOWN_MS = 600;
const MIN_QUERY_LENGTH = 2;
const MIN_GENRES = 1;
const MAX_GENRES = 3;
// 곡을 고른 뒤 이만큼(px) 아래로 스크롤하면 "다음 단계(장르·한마디)로 넘어간다"는 뜻으로 보고 결과 패널을 자동으로 접음
const AUTO_COLLAPSE_SCROLL_PX = 40;
// 서버 creation-status를 아직 못 받았을 때(로딩/조회 실패) 안내 문구에 쓰는 기본 하루 추천 한도
const DEFAULT_DAILY_MAX_LIMIT = 5;

const GENRE_OPTIONS = GENRES.filter((genre) => genre.key !== 'all');

// 곡 등록 실패 에러 코드별 클라이언트 대응 (API 문서의 "곡 추천 등록 규칙"/"AI 모더레이션 검열" 그대로)
// PL001·PL002·PL007: 토스트 노출 / PL003·C001: 문구 노출 및 수정 유도(폼 하단 인라인) / C004(500)·PL008: 재시도 유도 팝업
// (PL007: 같은 기기의 다른 등록이 아직 진행 중, PL008: 서버가 중복 등록 잠금을 확인하지 못한 일시 장애)
const TOAST_ERROR_MESSAGES: Record<string, string> = {
  PL001: '오늘 추천 가능한 곡을 모두 작성하셨어요! 내일 다시 참여해주세요.',
  PL002: '최근 7일 이내에 이미 추천하신 곡이에요. 다른 곡을 추천해주세요!',
  PL007: '다른 곡 등록이 진행 중이에요. 잠시 후 다시 시도해주세요.',
};
const INLINE_ERROR_MESSAGES: Record<string, string> = {
  PL003: '부적절하거나 비속어가 포함된 코멘트는 추천할 수 없어요.',
  C001: '장르는 최소 1개, 최대 3개까지 선택하고 코멘트는 200자 이내로 입력해주세요.',
};
const RETRY_ERROR_CODES = new Set(['C004', 'PL008']);
// 인라인 문구 에러(PL003·C001)는 폼 하단까지 시선이 안 가는 경우가 많아 같은 문구를 토스트로도 이만큼(ms) 띄움 — 인라인 문구는 수정할 때까지 그대로 남음
const INLINE_ERROR_TOAST_MS = 3000;

interface RecommendSongViewProps {
  onBack: () => void;
  // 등록 성공 시 호출 — 사용자가 자기 곡이 잘 올라갔는지 바로 확인할 수 있게 "최근 추가된 곡" 화면으로 이동시킴
  onSubmitSuccess: () => void;
  // 플레이어가 떠 있으면 등록하기 버튼이 그 위로 뜨도록 — 0이면 플레이어 닫힘
  playerHeight?: number;
  // 선택한 곡을 미리 들어볼 수 있게 하단 플레이어를 띄우는 콜백
  onPlay?: (track: PlayableTrack) => void;
  // 지금 하단 플레이어에서 재생 중인 곡 — 선택한 곡과 같으면 재생 아이콘이 일시정지 아이콘으로 바뀜
  currentTrackId?: string | null;
  // 게시글 모음 화면의 "이 곡 추천하러 가기" 버튼 등으로 특정 곡이 미리 정해진 채로 진입할 때 씀.
  prefillTrack?: SearchTrack | null;
  // 검색 결과 화면의 FAB으로 들어왔을 때, 그 검색어로 곡 검색을 미리 해둔 채 진입하기 위해 씀(prefillTrack과 달리 곡을 고르지는 않고 결과 목록만 띄움)
  prefillQuery?: string | null;
}

// 등록하기 버튼 자체의 높이(h-12)와, 그 위 마지막 섹션(곡에 대한 한마디)이 버튼에 가리지 않도록 두는 여유 간격
const REGISTER_BUTTON_HEIGHT = 48;
const REGISTER_BUTTON_CLEARANCE_GAP = 16;

export function RecommendSongView({ onBack, onSubmitSuccess, playerHeight = 0, onPlay, currentTrackId, prefillTrack, prefillQuery }: RecommendSongViewProps) {
  const initialQuery = prefillQuery && prefillQuery.trim().length >= MIN_QUERY_LENGTH ? prefillQuery.trim() : '';
  const [query, setQuery] = useState(initialQuery);
  // 검색 버튼을 눌러야만 바뀌는 "실제로 검색한 검색어" — query(입력창 타이핑)와 분리해서,
  // 타이핑 중엔 재검색이 안 나가고 버튼/Enter를 눌렀을 때만 useMusicSearch가 다시 호출됨
  const [committedQuery, setCommittedQuery] = useState(initialQuery);
  const [hasSearched, setHasSearched] = useState(initialQuery !== '');
  // 글자 수 미달 등 API를 부르기도 전에 걸러내는 입력값 검증 에러 — 네트워크 에러(searchError)와 구분
  const [validationError, setValidationError] = useState<string | null>(null);
  const { data: searchResultsData, isFetching: isSearching, error: musicSearchError, refetch: refetchMusicSearch } = useMusicSearch(committedQuery);
  const searchResults: MusicSearchTrack[] = searchResultsData ?? [];
  // 429(요청 제한) 응답이면 Retry-After만큼 재검색을 막고 남은 초를 안내 — 0이 되면 다시 검색 가능
  const { remainingSeconds: retryRemainingSeconds, isBlocked: isRetryBlocked } = useRetryCountdown(musicSearchError);
  const searchErrorMessage = validationError ?? getSearchErrorMessage(musicSearchError, retryRemainingSeconds);

  const [selectedTrack, setSelectedTrack] = useState<SearchTrack | null>(prefillTrack ?? null);
  // 앨범커버를 눌러 곡을 고른 경우엔 결과 패널을 닫지 않고 열어둠 — 여러 곡을 이어서 들어보며 고를 수 있게.
  // 하단 정보 영역으로 고르거나 새로 검색하면 다시 false로 돌아가 기존처럼 패널이 접힘
  const [keepResultsOpen, setKeepResultsOpen] = useState(false);
  // 결과 패널 아래 접기/펼치기 토글로 사용자가 직접 정한 상태 — null이면 위 규칙(자동)을 따르고, 곡을 고르거나 새로 검색하면 다시 null로 돌아감
  const [resultsToggleOverride, setResultsToggleOverride] = useState<boolean | null>(null);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [submitToast, setSubmitToast] = useState('');
  const [submitInlineError, setSubmitInlineError] = useState<string | null>(null);
  const submitToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showSubmitToast = (message: string, durationMs: number) => {
    if (submitToastTimerRef.current) clearTimeout(submitToastTimerRef.current);
    setSubmitToast(message);
    submitToastTimerRef.current = setTimeout(() => setSubmitToast(''), durationMs);
  };
  useEffect(() => () => { if (submitToastTimerRef.current) clearTimeout(submitToastTimerRef.current); }, []);
  const [showSubmitRetryPopup, setShowSubmitRetryPopup] = useState(false);
  const [showRegisterNoticePopup, setShowRegisterNoticePopup] = useState(false);
  const submitSong = useSubmitSong();
  const { data: creationStatus, isError: isStatusError, isFetching: isStatusFetching, refetch: refetchStatus } = useSongCreationStatus();
  const recentlyRecommendedTrackIds = new Set(creationStatus?.recentTrackIdsIn7Days ?? []);
  const dailyMaxLimit = creationStatus?.dailyMaxLimit ?? DEFAULT_DAILY_MAX_LIMIT;
  const { shouldShow: shouldShowFirstNotice, dismiss: dismissFirstNotice } = useFirstRecommendNotice();

  // 서버가 일시적으로 등록을 막은 상태(하루 한도와 별개) — "내일 다시"가 아니라 blockedUntil 기준으로 안내해야 해서
  // 한도 소진과 분리함. 둘 다 진입하자마자 막는 팝업을 띄움(상태 로딩 중/조회 실패엔 undefined라 안 뜸)
  const isTemporarilyBlocked = creationStatus?.temporarilyBlocked === true;
  // 오늘 추천 가능한 곡을 이미 다 채운 상태
  const isDailyLimitReached = creationStatus?.canCreate === false && !isTemporarilyBlocked;
  const isRegistrationBlocked = isDailyLimitReached || isTemporarilyBlocked;
  const blockedUntilLabel = formatBlockedUntil(creationStatus?.blockedUntil);

  // 안드로이드 하드웨어 뒤로가기 — 작성 중인 내용이 있어도 확인 없이 바로 나감(임시저장 기능은 기획에서 제외됨)
  useBackHandler(onBack);

  // 이탈 계측 — 임시저장 기능을 둘지 판단할 근거(작성하다 등록 없이 나가는 비율·어느 단계에서 나가는지).
  // playlist_recommend_entered(분모) 대비 playlist_recommend_abandoned(등록 성공 없이 화면을 떠남) 비율로 봄.
  // 화면을 떠나는 순간(언마운트)의 최신 입력 상태를 읽어야 해서 매 렌더 ref에 스냅샷을 갱신함
  const posthog = usePostHog();
  const enteredAtRef = useRef(Date.now());
  const submittedRef = useRef(false);
  const abandonSnapshotRef = useRef({ hasSearched, hasTrack: false, genreCount: 0, commentLength: 0, blocked: false });
  abandonSnapshotRef.current = {
    hasSearched,
    hasTrack: selectedTrack !== null,
    genreCount: selectedGenres.length,
    commentLength: comment.trim().length,
    blocked: isRegistrationBlocked,
  };
  useEffect(() => {
    posthog?.capture('playlist_recommend_entered', { prefilled_track: !!prefillTrack, prefilled_query: initialQuery !== '' });
    return () => {
      if (submittedRef.current) return;
      const duration = Date.now() - enteredAtRef.current;
      if (duration < 500) return; // 개발 모드 StrictMode의 즉시 재마운트 같은 노이즈 제외
      const { hasSearched: searched, hasTrack, genreCount, commentLength, blocked } = abandonSnapshotRef.current;
      // 가장 멀리 진행한 단계 — 한마디 > 장르 > 곡 선택 > 검색 > 아무것도 안 함 순
      const furthestStep = commentLength > 0 ? 'comment' : genreCount > 0 ? 'genre' : hasTrack ? 'track' : searched ? 'search' : 'none';
      posthog?.capture('playlist_recommend_abandoned', {
        furthest_step: furthestStep,
        has_track: hasTrack,
        genre_count: genreCount,
        comment_length: commentLength,
        blocked, // 한도 소진/임시 차단으로 진입 즉시 막힌 이탈 — 작성 포기와 구분해서 볼 것
        duration_ms: duration,
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lastSearchAtRef = useRef(0);

  const handleSearchClick = () => {
    if (query.trim().length < MIN_QUERY_LENGTH) {
      setSelectedTrack(null);
      setKeepResultsOpen(false);
      setResultsToggleOverride(null);
      setCommittedQuery('');
      setValidationError(`최소 ${MIN_QUERY_LENGTH}자 이상 입력해주세요!`);
      setHasSearched(true);
      return;
    }

    const now = Date.now();
    if (now - lastSearchAtRef.current < SEARCH_COOLDOWN_MS) return;
    if (isSearching || isRetryBlocked) return;
    lastSearchAtRef.current = now;

    setValidationError(null);
    setSelectedTrack(null);
    setKeepResultsOpen(false);
    setResultsToggleOverride(null);
    setHasSearched(true);
    // 직전 검색이 실패(429 등)한 같은 검색어면 쿼리 키가 그대로라 setState만으로는 재조회가 안 나가서 직접 refetch
    if (musicSearchError && normalizeMusicSearchQuery(query) === normalizeMusicSearchQuery(committedQuery)) {
      refetchMusicSearch();
      return;
    }
    setCommittedQuery(query); // useMusicSearch가 이 값으로 다시 조회(같은 검색어 30초 내 재검색이면 캐시 재사용)
  };

  // 토글 버튼은 검색을 한 번이라도 했고 검색 중이 아닐 때 보임 — 곡을 골라서 패널이 접힌 뒤에도 다시 펼쳐볼 수 있게
  const canToggleResults = hasSearched && !isSearching;
  const isResultsPanelOpen = canToggleResults && (resultsToggleOverride ?? (!selectedTrack || keepResultsOpen));

  // 서버가 최종 판단하지만(PL001/PL002 토스트가 안전망), creation-status 값이 이미 있으면 미리 막아서
  // 어차피 실패할 요청을 보내지 않게 함. 아직 안 불러와졌으면(undefined) 막지 않고 그대로 진행
  const canSubmit =
    !!selectedTrack &&
    selectedGenres.length >= MIN_GENRES &&
    creationStatus?.canCreate !== false &&
    !isTemporarilyBlocked &&
    !submitSong.isPending;

  // 곡을 고른 뒤 장르·한마디 같은 다음 단계 입력을 시작하면 결과 패널을 알아서 접음(곡을 고르지 않았으면 결과를 계속 둘러봐야 하니 그대로 둠)
  const collapseResultsAfterPick = () => {
    if (selectedTrack && isResultsPanelOpen) setResultsToggleOverride(false);
  };

  // 곡을 고른 채 아래로 스크롤해도 자동으로 접음 — 스크롤 컨테이너는 이 화면 밖(PlaylistView 루트, playlist-root 클래스)이라 closest로 찾음.
  // 사용자가 토글로 직접 펼쳐둔 상태(override === true)는 존중해서 건드리지 않음
  const searchSectionRef = useRef<HTMLElement>(null);
  const shouldWatchScroll = !!selectedTrack && isResultsPanelOpen && resultsToggleOverride !== true;
  useEffect(() => {
    if (!shouldWatchScroll) return;
    const scroller = searchSectionRef.current?.closest<HTMLElement>('.playlist-root');
    if (!scroller) return;
    const startTop = scroller.scrollTop;
    const onScroll = () => {
      if (scroller.scrollTop - startTop > AUTO_COLLAPSE_SCROLL_PX) setResultsToggleOverride(false);
    };
    scroller.addEventListener('scroll', onScroll, { passive: true });
    return () => scroller.removeEventListener('scroll', onScroll);
  }, [shouldWatchScroll]);

  const handleGenreClick = (key: string) => {
    collapseResultsAfterPick();
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
          submittedRef.current = true;
          onSubmitSuccess();
        },
        onError: (error) => {
          const code = (error as HttpError).code;

          if (code && TOAST_ERROR_MESSAGES[code]) {
            showSubmitToast(TOAST_ERROR_MESSAGES[code], 2500);
            return;
          }

          if (code && RETRY_ERROR_CODES.has(code)) {
            setShowSubmitRetryPopup(true);
            return;
          }

          const inlineMessage = code ? INLINE_ERROR_MESSAGES[code] : undefined;
          setSubmitInlineError(
            inlineMessage || (error instanceof Error ? error.message : '곡 추천에 실패했어요. 다시 시도해주세요.')
          );
          if (inlineMessage) showSubmitToast(inlineMessage, INLINE_ERROR_TOAST_MS);
        },
      }
    );
  };

  // FAB는 이 화면에서 숨겨지고 등록하기 버튼만 떠 있어서, 공용 --playlist-bottom-space 대신
  // 이 버튼 자신의 높이+여백만큼만 마지막 섹션이 가려지지 않게 직접 계산
  const registerButtonClearance = REGISTER_BUTTON_HEIGHT + REGISTER_BUTTON_CLEARANCE_GAP;
  const contentBottomPadding =
    playerHeight > 0
      ? `calc(${playerHeight}px + ${PLAYER_GAP_PX}px + ${registerButtonClearance}px + env(safe-area-inset-bottom))`
      : `calc(24px + ${registerButtonClearance}px + env(safe-area-inset-bottom))`;

  return (
    <div
      className="transition-[padding-bottom] duration-300 ease-out"
      style={{ paddingBottom: contentBottomPadding }}
    >
      <MiscSubViewHeader
        title="곡 추천하기"
        emoji="✏️"
        subtitle={
          creationStatus
            ? isTemporarilyBlocked
              ? '곡 추천이 일시적으로 제한되었어요'
              : creationStatus.canCreate
                ? creationStatus.recentTrackIdsIn7Days.length === 0
                  ? `하루에 최대 ${creationStatus.dailyMaxLimit}곡까지 추천할 수 있어요!`
                  : `오늘 ${creationStatus.remainingCount}곡 더 추천할 수 있어요! (${creationStatus.dailyCount}/${creationStatus.dailyMaxLimit})`
                : '오늘 추천 가능한 곡을 모두 채웠어요! 내일 다시 만나요 :)'
            : ''
        }
        subtitleLoading={!creationStatus && !isStatusError}
        onBack={onBack}
      />

      {/* 등록 가능 여부 조회 실패 — 막지는 않고(서버가 등록 시 최종 판단) 확인하지 못했음을 알리고 다시 확인할 수 있게 함 */}
      {isStatusError && (
        <div className="mb-4 flex items-center justify-between gap-2 rounded-card border border-slate-200 bg-white px-3.5 py-2.5">
          <p className="text-xs text-text-hint">오늘 추천 가능한 횟수를 확인하지 못했어요. 등록할 때 다시 확인해요.</p>
          <button
            onClick={() => refetchStatus()}
            disabled={isStatusFetching}
            className="flex-shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-text-main shadow-sm active:scale-95 transition-transform disabled:text-text-hint"
          >
            다시 확인
          </button>
        </div>
      )}

      {/* 1. 곡 검색 */}
      <section ref={searchSectionRef} className="mb-5">
        <h3 className="text-lg font-bold text-text-main mb-2">곡 검색</h3>
        {/* 검색창 + 아래 결과 패널을 한 group으로 묶어서, 입력창에 포커스가 가 있는 동안엔
            둘 다 같은 파란 테두리로 보이게 함(포커스 여부와 무관하게 결과 패널만 회색으로 남아 어긋나 보이던 문제) */}
        <div className="group">
          <div
            className={`bg-white border border-slate-200 shadow-[0_2px_4px_rgba(0,0,0,0.03)] group-focus-within:border-playlist-primary/40 transition-all ${
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
                disabled={isSearching || isRetryBlocked || !query.trim()}
                aria-label="곡 검색"
                className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full text-playlist-primary disabled:text-text-hint hover:bg-playlist-primary/10 transition-colors active:scale-90"
              >
                {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              </button>
              {/* 검색 결과 접기/펼치기 — 검색 아이콘 오른쪽. 한 번도 검색하지 않은 최초 상태(결과 자체가 없음)엔 숨김 */}
              {canToggleResults && (
                <button
                  onClick={() => setResultsToggleOverride(!isResultsPanelOpen)}
                  aria-label={isResultsPanelOpen ? '검색 결과 접기' : '검색 결과 펼치기'}
                  aria-expanded={isResultsPanelOpen}
                  // 검색 아이콘과 같은 색 규칙 — 쓸 수 있을 땐 파란색, 검색어가 비어 있으면 회색으로 비활성화
                  disabled={!query.trim()}
                  className="flex-shrink-0 -ml-1 flex items-center justify-center w-7 h-7 rounded-full text-playlist-primary disabled:text-text-hint hover:bg-playlist-primary/10 transition-colors active:scale-90"
                >
                  {isResultsPanelOpen ? <ChevronUp size={18} strokeWidth={2.2} /> : <ChevronDown size={18} strokeWidth={2.2} />}
                </button>
              )}
            </div>
          </div>

          {/* 검색 결과 — 검색창과 이어진 아코디언 패널 */}
          <div
            className={`grid transition-[grid-template-rows] duration-300 ease-out ${
              isResultsPanelOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
            }`}
          >
            <div className="overflow-hidden">
              <div className="bg-white border border-t-0 border-slate-200 group-focus-within:border-playlist-primary/40 transition-colors rounded-b-card py-3">
                {/* 곡 카드 렌더가 터져도 폼·장르·코멘트·팝업은 살아 있게 이 패널 안에서만 대체함. key=committedQuery:
                    렌더 에러로 폴백이 뜬 뒤에도 새로 검색하면 경계가 새로 마운트돼서 다시 시도됨 */}
                <ErrorBoundary
                  key={committedQuery}
                  name="recommend-song-search-results"
                  fallback={<PlaylistFallback message="곡 검색 결과를 표시할 수 없어요" minHeight={186} className="!border-0" />}
                >
                {searchResults.length > 0 ? (
                  <div
                    className="flex gap-3 px-3 overflow-x-auto [&::-webkit-scrollbar]:hidden"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    {searchResults.map((track) => {
                      // 최근 7일 이내에 이미 추천한 곡은 검색 결과에서 바로 골라내지 못하게 막음(어차피 서버가 PL002로 거절함)
                      const alreadyRecommended = recentlyRecommendedTrackIds.has(track.trackId);
                      return (
                        <MusicSearchResultCard
                          key={track.trackId}
                          track={track}
                          onPlay={onPlay}
                          isPlaying={track.trackId === currentTrackId}
                          onSelect={(selected, source) => {
                            setSelectedTrack(selected);
                            // 앨범커버로 선택할 땐 선택과 동시에 재생하고 결과 패널은 열어둠 — 이미 재생 중인 곡이면 onPlay가 일시정지로 토글해버리므로 재생은 건너뜀.
                            // 하단 정보 영역으로 선택할 땐 선택만 하고(재생 안 함) 기존처럼 패널을 접음
                            setKeepResultsOpen(source === 'cover');
                            setResultsToggleOverride(null);
                            if (source === 'cover' && selected.trackId !== currentTrackId) onPlay?.(selected);
                          }}
                          albumArtSelects
                          selectLabel={alreadyRecommended ? `${track.title} 최근 7일 내 이미 추천한 곡` : `${track.title} 선택`}
                          disabled={alreadyRecommended}
                          disabledMessage="최근 추천함"
                          showChevron={false}
                          className="w-[123px]"
                        />
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-text-hint text-center px-3 min-h-[186px] flex items-center justify-center whitespace-pre-line">
                    {searchErrorMessage || '검색 결과가 없어요'}
                  </p>
                )}
                </ErrorBoundary>
              </div>
            </div>
          </div>
        </div>

        {/* 선택된 곡 */}
        {selectedTrack && (
          <div className="mt-2 flex items-center gap-3 bg-white border border-playlist-primary/30 shadow-[0_2px_4px_rgba(0,0,0,0.03)] rounded-card px-3 py-2.5">
            <img
              src={selectedTrack.albumArtUrl}
              alt={selectedTrack.title}
              className="w-10 h-10 rounded object-cover flex-shrink-0 bg-slate-100"
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-text-main truncate">{selectedTrack.title}</div>
              <div className="text-xs text-text-sub truncate">{selectedTrack.artist}</div>
            </div>
            {onPlay && (
              <button
                onClick={() => onPlay(selectedTrack)}
                aria-label={selectedTrack.trackId === currentTrackId ? `${selectedTrack.title} 일시정지` : `${selectedTrack.title} 재생`}
                className="flex-shrink-0 p-1 hover:bg-slate-100 rounded-full transition-colors active:scale-90"
              >
                {selectedTrack.trackId === currentTrackId ? (
                  <Pause size={16} className="text-text-sub" fill="currentColor" />
                ) : (
                  <Play size={16} className="text-text-sub" fill="currentColor" />
                )}
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
        <div className="flex items-center gap-1 mb-2">
          <h3 className="text-lg font-bold text-text-main">장르</h3>
          <span className="text-xs font-semibold text-text-hint">({selectedGenres.length}/{MAX_GENRES})</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-card p-2 shadow-[0_2px_4px_rgba(0,0,0,0.03)] flex flex-wrap justify-center gap-2">
          {GENRE_OPTIONS.map((genre) => {
            const isSelected = selectedGenres.includes(genre.key);
            const isDisabled = !isSelected && selectedGenres.length >= MAX_GENRES;
            return (
              <button
                key={genre.key}
                onClick={() => handleGenreClick(genre.key)}
                disabled={isDisabled}
                className={`flex items-center gap-1 px-2 py-1 rounded-2xl text-[12px] font-bold border transition-all duration-200 active:scale-[0.96] ${
                  isSelected
                    ? `${genre.light} ${genre.activeBorder} text-gray-700`
                    : isDisabled
                      ? 'text-slate-300 border-slate-200'
                      : 'text-gray-700 border-gray-300'
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
        <div className="flex items-center gap-1 mb-2">
          <h3 className="text-lg font-bold text-text-main">곡에 대한 한마디</h3>
          <span className="text-xs font-semibold text-text-hint">(선택)</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-card px-3.5 py-2.5 shadow-[0_2px_4px_rgba(0,0,0,0.03)] focus-within:border-playlist-primary focus-within:shadow-[0_0_0_3px_rgba(15,23,42,0.15)] transition-all">
          <textarea
            value={comment}
            maxLength={COMMENT_MAX_LENGTH}
            onChange={(e) => setComment(e.target.value)}
            onFocus={collapseResultsAfterPick}
            placeholder={'이 곡에 대한 얘기를 자유롭게 남겨주세요!\n한마디가 생각나지 않는다면 건너뛰어도 돼요.'}
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

      {/* 추천하기 버튼 */}
      <button
        onClick={handleRegisterClick}
        disabled={!canSubmit}
        className={`fixed left-1/2 -translate-x-1/2 w-[calc(100%-4rem)] max-w-[360px] h-12 rounded-full text-sm font-bold border transition-all active:scale-[0.97] z-40 ${
          canSubmit
            ? 'bg-playlist-primary text-white border-transparent shadow-[0_6px_20px_rgba(15,23,42,0.35)]'
            : 'bg-slate-100 text-slate-300 border-transparent'
        }`}
        style={{
          bottom:
            playerHeight > 0
              ? `calc(${playerHeight}px + ${PLAYER_GAP_PX}px + env(safe-area-inset-bottom))`
              : 'calc(24px + env(safe-area-inset-bottom))',
          transition: 'bottom 300ms ease-out',
        }}
      >
        {submitSong.isPending ? '추천 중...' : '추천하기'}
      </button>

      {/* 추천 요청 중 화면 전체를 잠가서 중복 탭/다른 조작을 막고, 진행 상태를 눈에 띄게 보여줌 */}
      {submitSong.isPending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="flex flex-col items-center gap-3 bg-white rounded-2xl shadow-xl px-8 py-6">
            <Loader2 size={28} className="animate-spin text-playlist-primary" />
            <p className="text-sm font-semibold text-text-main">추천 중이에요...</p>
          </div>
        </div>
      )}

      {/* 등록 실패 안내 토스트(PL001/PL002/PL007, 인라인 문구 에러 PL003/C001) — 플레이리스트 공용 Toast */}
      {submitToast && <Toast message={submitToast} />}

      {/* 한도/임시 차단 팝업은 사전 안내용이고 서버가 등록 시 최종 판단하므로(PL001 등), 이 팝업 렌더가 터지면
          폴백 없이 그냥 안 그리고(null) 사용자는 그대로 진행하게 함 — 팝업 하나 때문에 화면 전체가 죽지 않게 */}
      <ErrorBoundary name="recommend-song-status-popups">
      {/* 1일 3곡 한도를 이미 채운 사용자 — 곡 검색·작성을 헛수고하지 않게 진입 즉시 막음. 바깥을 눌러도
          안 닫히고 뒤로가기만 가능(서버 PL001이 최종 방어선이라 이 팝업은 안내용) */}
      {isDailyLimitReached && (
        <ConfirmPopup
          buttons={
            <button
              onClick={onBack}
              className="w-full h-10 rounded-full text-sm font-bold text-white bg-playlist-primary active:scale-[0.97] transition-transform"
            >
              뒤로가기
            </button>
          }
        >
          <p className="text-sm font-semibold text-text-main mb-1 text-center">오늘 추천 가능한 곡을 모두 채웠어요!</p>
          <p className="text-xs text-text-sub mb-4 text-center">
            하루에 최대 {dailyMaxLimit}곡까지 추천할 수 있어요.
            <br />
            내일 다시 참여해주세요 :)
          </p>
        </ConfirmPopup>
      )}

      {/* 서버가 일시적으로 등록을 막은 사용자 — 한도 소진과 달리 "내일 다시"가 아니라 풀리는 시각을 안내.
          한도 팝업과 마찬가지로 바깥을 눌러도 안 닫히고 뒤로가기만 가능 */}
      {isTemporarilyBlocked && (
        <ConfirmPopup
          buttons={
            <button
              onClick={onBack}
              className="w-full h-10 rounded-full text-sm font-bold text-white bg-playlist-primary active:scale-[0.97] transition-transform"
            >
              뒤로가기
            </button>
          }
        >
          <p className="text-sm font-semibold text-text-main mb-1 text-center">곡 추천이 일시적으로 제한되었어요</p>
          <p className="text-xs text-text-sub mb-4 whitespace-pre-line text-center">
            {blockedUntilLabel ? `${blockedUntilLabel}까지는 곡을 추천할 수 없어요.\n이후에 다시 이용해주세요.` : '잠시 후 다시 이용해주세요.'}
          </p>
        </ConfirmPopup>
      )}

      </ErrorBoundary>

      {/* 서버 일시 장애(C004/PL008) 재시도 유도 팝업 */}
      {showSubmitRetryPopup && (
        <ConfirmPopup
          buttons={
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
                className="flex-1 h-10 rounded-full text-sm font-bold text-white bg-playlist-primary active:scale-[0.97] transition-transform"
              >
                다시 시도
              </button>
            </div>
          }
        >
          <p className="text-sm font-semibold text-text-main mb-1 text-center">일시적인 오류가 발생했어요</p>
          <p className="text-xs text-text-sub mb-4 text-center">잠시 후 다시 시도해주세요.</p>
        </ConfirmPopup>
      )}

      {/* 처음 들어온 사용자에게 하루 추천 한도를 한 번만 안내 — 한도 소진/임시 차단 팝업이 이미 떠 있으면 겹치지 않게 건너뜀 */}
      {shouldShowFirstNotice && !isRegistrationBlocked && (
        <ConfirmPopup
          buttons={
            <button
              onClick={dismissFirstNotice}
              className="w-full h-10 rounded-full text-sm font-bold text-white bg-playlist-primary active:scale-[0.97] transition-transform"
            >
              확인했어요
            </button>
          }
        >
          <p className="text-sm font-semibold text-text-main mb-1 text-center">곡 추천은 하루 {dailyMaxLimit}곡까지!</p>
          <p className="text-xs text-text-sub mb-4 text-center">
            하루에 최대 {dailyMaxLimit}곡까지 추천할 수 있어요.
            <br />
            마음에 드는 곡을 골라 추천해보세요 :)
          </p>
        </ConfirmPopup>
      )}

      {/* 추천 전 안내 — 삭제·수정 불가, 하루 추천 한도 */}
      {showRegisterNoticePopup && (
        <ConfirmPopup
          buttons={
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
                className="flex-1 h-10 rounded-full text-sm font-bold text-white bg-playlist-primary active:scale-[0.97] transition-transform"
              >
                추천하기
              </button>
            </div>
          }
        >
          <p className="text-sm font-bold text-text-main mb-1.5 text-center">
            {creationStatus ? `오늘 ${creationStatus.remainingCount}곡 더 추천할 수 있어요!` : `하루에 최대 ${dailyMaxLimit}곡 추천할 수 있어요!`}
          </p>
          <p className="text-xs text-text-sub mb-4 text-center">추천한 곡은 삭제하거나 수정할 수 없어요.</p>
        </ConfirmPopup>
      )}
    </div>
  );
}
