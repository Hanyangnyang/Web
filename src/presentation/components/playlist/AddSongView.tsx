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
const SEARCH_DEBOUNCE_MS = 600;

// TODO: 실제 스포티파이 검색 연동 전까지 쓰는 목업 데이터.
// 기존 /api/music.js는 title+artist로 트랙 1개를 찾는 용도라 자유 검색어에는 못 씀 — 별도 검색 API 필요.
const MOCK_SEARCH_CATALOG: SearchTrack[] = [
  { trackId: '5eBM5qATb1IfJvNzGuS2GX', title: 'Busy Boy', artist: '주혜린', albumArtUrl: '' },
  { trackId: '171mGT1HdxM2HdqZrWNY31', title: '다큐멘터리', artist: '윤마치', albumArtUrl: '' },
  { trackId: '3c0anSTjsn20lztbBmZt03', title: '미장원', artist: '주혜린', albumArtUrl: '' },
  { trackId: '0kt2S0FV9DEGIOg247sT8b', title: '미친건가', artist: '주혜린', albumArtUrl: '' },
  { trackId: '4uh6rj3FryYQXMz9zLqDKL', title: 'Fly away', artist: '권진아', albumArtUrl: '' },
  { trackId: '3Q3wWJxr6sBt8afP9hJj4J', title: 'LOVE SONG', artist: '유다빈밴드', albumArtUrl: '' },
  { trackId: '4Qqd4mzQzVGpvPrzq3Dtn8', title: '초록', artist: '윤마치', albumArtUrl: '' },
  { trackId: '6W4iF5kAqqwKiVwAk3TcN1', title: '하루에 한번씩', artist: '거니', albumArtUrl: '' },
  { trackId: '63yKhliWjZOJ39UQhXcBhO', title: '왜,왜,왜', artist: 'SUMIN', albumArtUrl: '' },
];

function searchTracksMock(query: string): Promise<SearchTrack[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const q = query.trim().toLowerCase();
      if (!q) {
        resolve([]);
        return;
      }
      resolve(
        MOCK_SEARCH_CATALOG.filter(
          (track) => track.title.toLowerCase().includes(q) || track.artist.toLowerCase().includes(q)
        )
      );
    }, 500);
  });
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
  const [selectedTrack, setSelectedTrack] = useState<SearchTrack | null>(null);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [comment, setComment] = useState('');

  const lastSearchAtRef = useRef(0);

  const handleSearchClick = () => {
    const now = Date.now();
    if (now - lastSearchAtRef.current < SEARCH_DEBOUNCE_MS) return;
    if (!query.trim() || isSearching) return;
    lastSearchAtRef.current = now;

    setIsSearching(true);
    setSelectedTrack(null);
    searchTracksMock(query).then((results) => {
      setSearchResults(results);
      setHasSearched(true);
      setIsSearching(false);
    });
  };

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
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-card px-3.5 py-2.5 shadow-[0_2px_4px_rgba(0,0,0,0.03)] focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(14,74,132,0.1)] transition-all">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="곡 제목이나 아티스트를 검색해보세요"
            className="flex-1 bg-transparent text-sm text-text-main placeholder-text-hint outline-none"
          />
          <button
            onClick={handleSearchClick}
            disabled={isSearching || !query.trim()}
            aria-label="곡 검색"
            className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full text-primary disabled:text-text-hint hover:bg-primary/10 transition-colors active:scale-90"
          >
            {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          </button>
        </div>

        {/* 선택된 곡 */}
        {selectedTrack && (
          <div className="mt-3 flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-card px-3 py-2.5">
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

        {/* 검색 결과 */}
        {!selectedTrack && hasSearched && !isSearching && (
          searchResults.length > 0 ? (
            <div className="mt-3 bg-white rounded-card border border-slate-200 divide-y divide-slate-200 overflow-hidden">
              {searchResults.map((track) => (
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
              ))}
            </div>
          ) : (
            <p className="mt-3 text-xs text-text-hint text-center py-3">검색 결과가 없어요</p>
          )
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
