import { Loader2, Play, Search, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { MiscSubViewHeader } from '../misc/MiscSubViewHeader';
import { type Song, GENRES } from './playlistTypes';
import { type PlayableTrack } from './FloatingSpotifyPlayer';

interface SearchTrack {
  trackId: string;
  title: string;
  artist: string;
  albumArtUrl: string;
}

const COMMENT_MAX_LENGTH = 200;
const SEARCH_COOLDOWN_MS = 600;
const MIN_QUERY_LENGTH = 2;
const MIN_GENRES = 1;
const MAX_GENRES = 3;

const GENRE_OPTIONS = GENRES.filter((genre) => genre.key !== 'all');

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
  // Supabase 테이블 붙기 전까지 임시로 로컬 더미데이터에 곡을 추가하는 콜백
  onSongAdded: (song: Song) => void;
  // 플레이어가 떠 있으면 등록하기 버튼이 그 위로 뜨도록 — 0이면 플레이어 닫힘
  playerHeight?: number;
  // 선택한 곡을 미리 들어볼 수 있게 하단 플레이어를 띄우는 콜백
  onPlay?: (track: PlayableTrack) => void;
  // 지금 하단 플레이어에서 재생 중인 곡 — 선택한 곡과 같으면 재생 버튼을 숨김
  currentTrackId?: string | null;
}

// 플레이어 카드 위 16px 간격을 두고 뜨도록 — AddSongFab과 동일한 값
const PLAYER_GAP = 16;

export function AddSongView({ onBack, onSongAdded, playerHeight = 0, onPlay, currentTrackId }: AddSongViewProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchTrack[]>([]);
  const [searchErrorMessage, setSearchErrorMessage] = useState<string | null>(null);
  const [retryBlockedUntil, setRetryBlockedUntil] = useState(0);
  const [selectedTrack, setSelectedTrack] = useState<SearchTrack | null>(null);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [comment, setComment] = useState('');

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

  const canSubmit = !!selectedTrack && selectedGenres.length >= MIN_GENRES && comment.trim().length > 0;

  const handleGenreClick = (key: string) => {
    setSelectedGenres((prev) => {
      if (prev.includes(key)) return prev.filter((g) => g !== key);
      if (prev.length >= MAX_GENRES) return prev;
      return [...prev, key];
    });
  };

  const handleSubmit = () => {
    if (!canSubmit || !selectedTrack) return;
    const genreLabels = selectedGenres.map((key) => GENRES.find((genre) => genre.key === key)?.label ?? key);

    onSongAdded({
      trackId: selectedTrack.trackId,
      title: selectedTrack.title,
      artist: selectedTrack.artist,
      albumArtUrl: selectedTrack.albumArtUrl,
      comment: comment.trim(),
      genres: genreLabels,
      previewUrl: '',
      createdAt: new Date(),
    });
    onBack();
  };

  return (
    <div className="pb-[calc(var(--playlist-bottom-space,204px)+env(safe-area-inset-bottom))] transition-[padding-bottom] duration-300 ease-out">
      <MiscSubViewHeader
        title="곡 추천하기"
        emoji="🤔"
        subtitle=""
        onBack={onBack}
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
            <div className="bg-white border border-t-0 border-slate-200 rounded-b-card divide-y divide-slate-200">
              {searchResults.length > 0 ? (
                searchResults.map((track) => (
                  <button
                    key={track.trackId}
                    onClick={() => setSelectedTrack(track)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 transition-colors text-left"
                  >
                    <img
                      src={track.albumArtUrl}
                      alt={track.title}
                      className="w-10 h-10 rounded object-cover flex-shrink-0 bg-slate-100"
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-text-main truncate">{track.title}</div>
                      <div className="text-xs text-text-sub truncate">{track.artist}</div>
                    </div>
                  </button>
                ))
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

      {/* 등록하기 버튼 */}
      <button
        onClick={handleSubmit}
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
        등록하기
      </button>
    </div>
  );
}
