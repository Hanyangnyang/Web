import { Loader2, Search, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { MiscSubViewHeader } from '../misc/MiscSubViewHeader';
import { getGenreColor, getGenreActiveColor } from './playlistTheme';
import { GENRES } from './playlistTypes';

interface SearchTrack {
  trackId: string;
  title: string;
  artist: string;
  albumArtUrl: string;
}

const COMMENT_MAX_LENGTH = 30;
const SEARCH_COOLDOWN_MS = 600;
const MIN_QUERY_LENGTH = 2;

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
  onRequireLogin: () => void;
}

export function AddSongView({ onBack, onRequireLogin }: AddSongViewProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchTrack[]>([]);
  const [searchErrorMessage, setSearchErrorMessage] = useState<string | null>(null);
  const [retryBlockedUntil, setRetryBlockedUntil] = useState(0);
  const [selectedTrack, setSelectedTrack] = useState<SearchTrack | null>(null);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
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

  const canSubmit = !!selectedTrack && !!selectedGenre && comment.trim().length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onRequireLogin();
  };

  return (
    <div className="pb-32">
      <MiscSubViewHeader
        title="곡 추천하기"
        emoji="🤔"
        subtitle=""
        onBack={onBack}
      />

      {/* 곡 검색 */}
      <section className="mb-5">
        <h3 className="text-lg font-bold text-text-main mb-3">곡 검색</h3>
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
          <div className="mt-3 flex items-center gap-3 bg-white border border-primary/30 shadow-[0_2px_4px_rgba(0,0,0,0.03)] rounded-card px-3 py-2.5">
            <img
              src={selectedTrack.albumArtUrl}
              alt={selectedTrack.title}
              className="w-10 h-10 rounded object-cover flex-shrink-0 bg-slate-100"
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-text-main truncate">{selectedTrack.title}</div>
              <div className="text-xs text-text-sub truncate">{selectedTrack.artist}</div>
            </div>
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

      {/* 장르 */}
      <section className="mb-5">
        <h3 className="text-lg font-bold text-text-main mb-3">장르</h3>
        <div className="flex flex-wrap gap-2">
          {GENRES.filter((genre) => genre.key !== 'all').map((genre) => (
            <button
              key={genre.key}
              onClick={() => setSelectedGenre((prev) => (prev === genre.key ? null : genre.key))}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-bold border transition-all duration-200 active:scale-[0.96] ${
                selectedGenre === genre.key
                  ? `${getGenreActiveColor(genre.colorIndex)} text-white border-transparent shadow-[0_2px_6px_rgba(14,74,132,0.25)]`
                  : `${getGenreColor(genre.colorIndex)} text-gray-800 border-transparent`
              }`}
            >
              <span className="text-base">{genre.emoji}</span>
              <span>{genre.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* 한마디 */}
      <section className="mb-5">
        <h3 className="text-lg font-bold text-text-main mb-3">한마디</h3>
        <div className="bg-white border border-slate-200 rounded-card px-3.5 py-2.5 shadow-[0_2px_4px_rgba(0,0,0,0.03)] focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(14,74,132,0.1)] transition-all">
          <input
            type="text"
            value={comment}
            maxLength={COMMENT_MAX_LENGTH}
            onChange={(e) => setComment(e.target.value)}
            placeholder="이 곡에 대한 한마디를 남겨주세요"
            className="w-full bg-transparent text-sm text-text-main placeholder-text-hint outline-none"
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
        className={`fixed left-1/2 -translate-x-1/2 w-[calc(100%-4rem)] max-w-[360px] h-12 rounded-full text-sm font-bold shadow-[0_6px_20px_rgba(14,74,132,0.3)] transition-all active:scale-[0.97] z-40 ${
          canSubmit ? 'bg-primary text-white' : 'bg-slate-200 text-slate-400'
        }`}
        style={{ bottom: 'calc(24px + 64px + 24px + env(safe-area-inset-bottom))' }}
      >
        등록하기
      </button>
    </div>
  );
}
