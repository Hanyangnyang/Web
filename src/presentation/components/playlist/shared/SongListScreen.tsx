import { LayoutGrid, Rows3 } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { MiscSubViewHeader } from '../../misc/MiscSubViewHeader';
import { type Song, type TrackSummary, filterSongsByGenre } from '../playlistTypes';
import { PostDetailCard, songToPostDetailCardData, BODY_TOGGLE_MS } from './PostDetailCard';
import { PostDetailCardSkeleton } from './PostDetailCardSkeleton';
import { EmptyGenreState } from './EmptyGenreState';
import { GenreFilterChips, EMPTY_GENRE_FILTER, type GenreFilterState } from './GenreFilterChips';
import { Coachmark, useCoachmark } from './Coachmark';
import { ScrollToTopPill } from './ScrollToTopPill';
import { type RecentSongsTapAreaVariant } from '../../../hooks/playlist/usePlaylistExperiment';
import { scrollNearestScrollableAncestorToTop } from '../../../../utils/scroll';

// 그리드/리스트 보기 전환 버튼 코치마크를 한 번 봤는지 — 다시 안 뜨게 기기에 남겨둔다(Coachmark.tsx 참고)
const VIEW_TOGGLE_COACHMARK_SEEN_KEY = 'viewToggleCoachmarkSeen';

interface SongListScreenProps {
  title: string;
  emoji?: string;
  subtitle?: string;
  songs: Song[];
  // true면 목록이 아직 로딩 중이라 EmptyGenreState 대신 로딩 표시를 보여줌
  isLoading?: boolean;
  onBack: () => void;
  onPlay: (song: Song) => void;
  onShowAddSong: () => void;
  // 넘겨주면 카드의 곡명·가수명을 눌렀을 때 이 곡의 게시글 모음(TrackPostCollectionView)으로 이동
  onSelectTrack?: (track: TrackSummary) => void;
  // 빈 상태 문구/버튼/동작을 화면마다 다르게 하고 싶을 때 오버라이드 — 없으면 장르 안내 문구 + 곡추천하기로 기본 동작
  emptyStateMessage?: string;
  emptyStateButtonLabel?: string;
  onEmptyStateAction?: () => void;
  // 그리드(2열)/1열 보기 전환 UI를 이 화면에서 쓸지 여부 — 예: 최근 추가된 곡만 지원
  enableViewToggle?: boolean;
  // 2열(요약 카드)로만 보여주고 1열 상세 보기·전환 버튼은 제공하지 않음 — 카드를 눌러도 상세(1열)로 전환되지 않고,
  // 곡명·가수명을 눌러 게시글 모음으로 이동하는 것만 가능. enableViewToggle/viewMode보다 우선
  gridOnly?: boolean;
  // 뷰 모드를 상위(PlaylistView)에서 제어하고 싶을 때 넘김 — 게시글 상세로 갔다가 뒤로가기로 돌아와도
  // 이 화면이 통째로 언마운트/리마운트되면서 내부 state가 초기화되는데, 상위에 보관해두면 마지막으로
  // 보던 모드가 그대로 유지됨. 안 넘기면 이 화면 내부 state로만 관리(항상 1열로 시작)
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
  // 홈에서 누른 카드로 바로 스크롤하기 위한 대상 trackId
  scrollToTrackId?: string | null;
  // 지금 하단 플레이어에서 재생 중인 곡 — 해당 카드의 재생 아이콘이 일시정지 아이콘으로 바뀜
  currentTrackId?: string | null;
  // 빈 상태를 흰 카드 박스로 감쌀지 — 최근추가된곡의 카드 그리드와 톤을 맞추려는 화면(기본값)용.
  // 저장한 곡/내가 등록한 곡처럼 배경이 이미 흰 화면에서는 굳이 박스가 필요 없어 false로 끔
  emptyStateBoxed?: boolean;
  // "최근 추가된 곡" 재생 인터랙션 A/B 테스트에서 카드 재생 버튼 배정값 — RecentSongsView만 넘겨줌.
  // 안 넘기면 PostDetailCard가 기존(control) 동작으로 렌더링됨
  playButtonVariant?: RecentSongsTapAreaVariant;
  // true면 카드의 "내 추천" 뱃지를 숨김 — 목록이 전부 내 글인 화면용(지금은 저장한 곡만 사용 — 내가 추천한 곡 화면은 뱃지를 보여줌)
  hideMineBadge?: boolean;
  // 장르 필터를 상위(PlaylistView)에서 제어하고 싶을 때 넘김 — 홈 미리보기와 선택·칩 위치를 동기화. 안 넘기면 이 화면 내부 state로만 관리
  genreFilter?: GenreFilterState;
  onGenreFilterChange?: (next: GenreFilterState) => void;
}

export function SongListScreen({
  title,
  emoji,
  subtitle,
  songs,
  isLoading = false,
  onBack,
  onPlay,
  onShowAddSong,
  onSelectTrack,
  emptyStateMessage,
  emptyStateButtonLabel,
  onEmptyStateAction,
  enableViewToggle = false,
  gridOnly = false,
  scrollToTrackId,
  currentTrackId,
  emptyStateBoxed = true,
  viewMode: viewModeProp,
  onViewModeChange,
  playButtonVariant,
  hideMineBadge = false,
  genreFilter: genreFilterProp,
  onGenreFilterChange,
}: SongListScreenProps) {
  const [internalGenreFilter, setInternalGenreFilter] = useState<GenreFilterState>(EMPTY_GENRE_FILTER);
  const genreFilter = genreFilterProp ?? internalGenreFilter;
  const setGenreFilter = onGenreFilterChange ?? setInternalGenreFilter;
  const selectedGenres = genreFilter.selected;
  // 지금 이모지 선택창이 열려 있는 카드(song.id ?? song.trackId) — 목록 전체에서 하나만 열리도록 여기서 보관
  const [openPickerKey, setOpenPickerKey] = useState<string | null>(null);
  const [internalViewMode, setInternalViewMode] = useState<'grid' | 'list'>('grid'); // 기본은 2열 — 1열은 토글로 전환
  const viewMode = gridOnly ? 'grid' : (viewModeProp ?? internalViewMode);
  const setViewMode = (mode: 'grid' | 'list') => {
    onViewModeChange?.(mode);
    setInternalViewMode(mode);
  };
  // 홈/게시글 모음 등에서 특정 곡을 눌러 들어왔을 때의 스크롤 대상 — 값이 바뀌지 않는 한 그리드⇄리스트를
  // 오가도 같은 카드를 계속 다시 스크롤해서 보여주므로, 토글 버튼으로 1열↔2열을 바꿔도 그 카드가 보이던 위치 그대로 복원됨
  const [scrollTarget] = useState<string | null>(scrollToTrackId ?? null);
  const filteredSongs = filterSongsByGenre(songs, selectedGenres);

  const listContainerRef = useRef<HTMLDivElement>(null);

  // 2열에서 한 카드가 한마디를 펼쳐도 같은 행의 옆 카드는 원래 높이를 유지하게 함 — 그리드가 행 높이를 맞추느라(items-stretch)
  // 옆 카드를 같이 늘려버리기 때문. 펼치기 시작할 때 옆 카드의 현재 높이(=펼치기 전 행 높이)를 재서 보관하고,
  // 펼친 동안 그 높이로 고정(align-self:start). 둘 다 펼쳤거나 둘 다 접혔으면 고정하지 않음.
  // 접을 땐 애니메이션이 끝난 뒤(BODY_TOGGLE_MS) 펼침 상태를 해제해서, 접히는 도중 옆 카드가 커졌다 줄어드는 일이 없게 함
  const songKey = (song: Song) => song.id ?? song.trackId;
  const [expandedKeys, setExpandedKeys] = useState<ReadonlySet<string>>(new Set());
  const [baseHeights, setBaseHeights] = useState<Record<string, number>>({});
  const collapseTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  useEffect(() => () => Object.values(collapseTimersRef.current).forEach(clearTimeout), []);
  useEffect(() => setBaseHeights({}), [viewMode, selectedGenres]); // 짝이 바뀌므로 재둔 높이는 버림

  const handleBodyExpandedChange = (song: Song, index: number, expanded: boolean) => {
    const key = songKey(song);
    clearTimeout(collapseTimersRef.current[key]);
    if (expanded) {
      const partner = viewMode === 'grid' ? filteredSongs[index ^ 1] : undefined; // 같은 행의 짝: 0↔1, 2↔3 ...
      const partnerEl = partner && listContainerRef.current?.querySelector<HTMLElement>(`[data-song-key="${songKey(partner)}"]`);
      if (partner && partnerEl && !expandedKeys.has(songKey(partner))) {
        setBaseHeights((prev) => ({ ...prev, [songKey(partner)]: partnerEl.offsetHeight }));
      }
      setExpandedKeys((prev) => new Set(prev).add(key));
    } else {
      collapseTimersRef.current[key] = setTimeout(() => {
        setExpandedKeys((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }, BODY_TOGGLE_MS + 20);
    }
  };
  // 짝은 펼쳐졌는데 나는 접혀 있을 때만, 짝이 펼치기 전의 행 높이로 고정
  const lockedHeightFor = (song: Song, index: number): number | undefined => {
    if (viewMode !== 'grid') return undefined;
    const partner = filteredSongs[index ^ 1];
    if (!partner || !expandedKeys.has(songKey(partner)) || expandedKeys.has(songKey(song))) return undefined;
    return baseHeights[songKey(song)];
  };

  // 대상이 있거나 뷰 모드가 바뀌어 목록 DOM이 다시 그려질 때마다 해당 카드로 부드럽게 스크롤
  // 처음 진입할 땐 홈에서 내려와 있던 스크롤 위치가 그대로 남아 있어 아래→위로 스크롤되므로, 맨 위로 먼저 옮긴 뒤 위→아래로 스크롤
  const didInitialScrollRef = useRef(false);
  // 찾아온 카드를 잠깐 강조 — 처음 스크롤할 때 대상 카드가 실제로 그려져 있을 때만 한 번 켬(토글로 1열↔2열을 바꿀 땐 다시 켜지 않음)
  const [highlightedTrackId, setHighlightedTrackId] = useState<string | null>(null);
  useLayoutEffect(() => {
    if (!scrollTarget) return;
    const isInitial = !didInitialScrollRef.current;
    if (isInitial) {
      didInitialScrollRef.current = true;
      scrollNearestScrollableAncestorToTop(listContainerRef.current);
    }
    const target = listContainerRef.current?.querySelector<HTMLElement>(`[data-track-id="${scrollTarget}"]`);
    target?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    if (isInitial && target) setHighlightedTrackId(scrollTarget);
  }, [viewMode, scrollTarget]);
  useEffect(() => {
    if (!highlightedTrackId) return;
    const timer = setTimeout(() => setHighlightedTrackId(null), 2400);
    return () => clearTimeout(timer);
  }, [highlightedTrackId]);

  // (2열 카드를 눌러 1열 상세로 전환하던 동작은 없앰 — 카드 하단을 누르면 한마디 더보기/접기로 동작함. 1열은 우측 상단 토글 버튼으로 전환)

  // 그리드 보기 전환 버튼 코치마크 — 처음 온 사람에게만, 잠깐 떴다 사라진다
  const viewToggleCoachmark = useCoachmark(VIEW_TOGGLE_COACHMARK_SEEN_KEY, enableViewToggle);

  return (
    <div className="-mx-4 px-4 pb-[calc(var(--playlist-bottom-space,204px)+env(safe-area-inset-bottom))] transition-[padding-bottom] duration-300 ease-out">
      {/* 고정 헤더 */}
      <div className="sticky -top-6 -mt-6 z-[100] bg-white/90 backdrop-blur-xl pt-6 -mx-4 px-4 rounded-b-xl border-b border-slate-200/50 shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
        <MiscSubViewHeader
          title={title}
          emoji={emoji}
          subtitle={subtitle}
          onBack={onBack}
          rightAction={
            enableViewToggle ? (
              <div className="relative">
                {/* 2열/1열 토글 — 두 아이콘을 모두 보여주고 현재 모드 쪽에 흰 썸이 올라간다 */}
                <div
                  role="group"
                  aria-label="목록 보기 방식"
                  className={`relative flex items-center w-[76px] h-9 p-[3px] rounded-full bg-slate-100 border border-slate-200 shadow-[0_6px_20px_rgba(0,0,0,0.08)] ${viewToggleCoachmark.state !== 'hidden' ? 'z-[45]' : ''}`}
                >
                  <span
                    aria-hidden
                    className="absolute top-[3px] left-[3px] w-[34px] h-[28px] rounded-full bg-white shadow-sm transition-transform duration-200 ease-out"
                    style={{ transform: viewMode === 'grid' ? 'translateX(0)' : 'translateX(100%)' }}
                  />
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    aria-label="2열로 보기"
                    aria-pressed={viewMode === 'grid'}
                    className={`relative z-10 flex-1 h-full flex items-center justify-center rounded-full transition-colors ${viewMode === 'grid' ? 'text-text-main' : 'text-slate-400'}`}
                  >
                    <LayoutGrid size={16} strokeWidth={2} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    aria-label="1열로 보기"
                    aria-pressed={viewMode === 'list'}
                    className={`relative z-10 flex-1 h-full flex items-center justify-center rounded-full transition-colors ${viewMode === 'list' ? 'text-text-main' : 'text-slate-400'}`}
                  >
                    <Rows3 size={16} strokeWidth={2} />
                  </button>
                </div>

                {/* 그리드 보기 코치마크 — 버튼 존재를 알려주려고 3초만 떴다 사라진다 */}
                <Coachmark
                  {...viewToggleCoachmark}
                  className="absolute right-0 top-full mt-2"
                >
                  원하는 형태로 볼 수 있어요!👀
                </Coachmark>
              </div>
            ) : undefined
          }
        />
        <GenreFilterChips
          value={genreFilter}
          onChange={setGenreFilter}
          large
          className="-mt-1.5 pb-2"
        />
        <ScrollToTopPill />
      </div>
      {/* 곡 리스트 — 인스타그램 피드처럼 2열 카드 그리드 또는 1열 리스트 */}
      <div ref={listContainerRef} className="-mx-4 px-2">
        {isLoading ? (
          <div className={`grid gap-3 py-1 ${viewMode === 'grid' ? 'grid-cols-2 items-stretch' : 'grid-cols-1'}`}>
            {Array.from({ length: viewMode === 'grid' ? 4 : 3 }).map((_, i) => (
              <PostDetailCardSkeleton key={i} variant={viewMode === 'grid' ? 'grid' : 'card'} />
            ))}
          </div>
        ) : filteredSongs.length === 0 ? (
          <EmptyGenreState
            onAction={onEmptyStateAction ?? onShowAddSong}
            message={emptyStateMessage}
            buttonLabel={emptyStateButtonLabel}
            boxed={emptyStateBoxed}
          />
        ) : (
          <div className={`grid gap-3 py-1 ${viewMode === 'grid' ? 'grid-cols-2 items-stretch' : 'grid-cols-1'}`}>
            {filteredSongs.map((song, index) => {
              const lockedHeight = lockedHeightFor(song, index);
              return (
              <div
                key={songKey(song)}
                data-track-id={song.trackId}
                data-song-key={songKey(song)}
                className={`${viewMode === 'grid' ? 'h-full' : ''} ${song.trackId === highlightedTrackId ? 'rounded-2xl [animation:songCardHighlight_1.8s_ease-out_0.3s_both]' : ''}`.trim() || undefined}
                style={lockedHeight !== undefined ? { alignSelf: 'start', height: lockedHeight } : undefined}
              >
                <PostDetailCard
                  post={songToPostDetailCardData(song)}
                  // 2열(그리드)에서는 같은 행 카드끼리 높이를 맞춤 — 본문 길이가 짧은 카드도 옆 카드 높이만큼 늘어남
                  className={viewMode === 'grid' ? 'w-full h-full' : 'w-full'}
                  onPlay={() => onPlay(song)}
                  isPlaying={song.trackId === currentTrackId}
                  // 2열에서도 하단 구성(이모지 반응·제목·본문·장르·시간)은 1열과 동일 — 폭이 좁아서 크기만 narrow로 조정.
                  // 반응을 숨기는 건 곡명·가수명만 보여주는 저장한 곡(gridOnly)뿐
                  hideReactions={gridOnly}
                  narrow={viewMode === 'grid'}
                  // 2열의 이모지 선택창은 1열과 같은 폭이라 카드보다 넓음 — 왼쪽 열은 오른쪽으로, 오른쪽 열은 왼쪽으로 펼쳐서 화면 밖으로 안 나가게 함
                  pickerAnchor={viewMode === 'grid' ? (index % 2 === 0 ? 'left' : 'right') : undefined}
                  // 이모지 선택창은 목록 전체에서 하나만 열림 — 다른 카드의 버튼을 누르면 앞서 열린 것이 닫힘
                  pickerOpen={openPickerKey === (song.id ?? song.trackId)}
                  onPickerOpenChange={(open) => setOpenPickerKey(open ? (song.id ?? song.trackId) : null)}
                  onBodyExpandedChange={(expanded) => handleBodyExpandedChange(song, index, expanded)}
                  onSelectTrack={onSelectTrack}
                  // 2열 고정(저장한 곡)에서는 더보기(⋯) 대신 > 버튼으로 곡의 게시글 모음에 바로 이동
                  trailingAction={gridOnly ? 'trackLink' : 'more'}
                  compact={gridOnly}
                  playButtonVariant={playButtonVariant}
                  hideMineBadge={hideMineBadge}
                />
              </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
