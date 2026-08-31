import { ArrowRight, Play, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { MiscSubViewHeader } from '../misc/MiscSubViewHeader';
import { type Song } from './playlistTypes';
import { useSongSearch } from '../../hooks/useRecentSongs.js';

interface SearchResultsViewProps {
  query: string;
  onBack: () => void;
  onSelectTrack: (track: TrackResult) => void;
  onSelectPost: (post: Song) => void;
  // 곡 검색 결과의 앨범커버를 눌렀을 때 하단 플레이어로 재생
  onPlay: (track: TrackResult) => void;
  // 지금 하단 플레이어에서 재생 중인 곡 — 해당 카드의 재생 버튼을 숨김
  currentTrackId?: string | null;
}

export interface TrackResult {
  trackId: string;
  title: string;
  artist: string;
  albumArtUrl: string;
}

const MIN_QUERY_LENGTH = 2;

// 검색 결과 화면 — 곡 검색은 Spotify 검색 API(/api/music-search), 게시글 검색은 BE 추천글 통합 검색 API 연동 완료
export function SearchResultsView({ query, onBack, onSelectTrack, onSelectPost, onPlay, currentTrackId }: SearchResultsViewProps) {
  // 처음 진입 시 검색어(query prop)로 시작하고, 이 화면 안에서 재검색하면 activeQuery만 갱신 —
  // query prop 자체는 부모(PlaylistView)의 홈 검색바 상태라 건드리지 않음
  const [activeQuery, setActiveQuery] = useState(query);
  const { data: postResults, isLoading: isSearchingPosts } = useSongSearch(activeQuery);
  const [localQuery, setLocalQuery] = useState(query);
  const [trackResults, setTrackResults] = useState<TrackResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // 검색바에서 Enter를 치거나 화살표 버튼을 누르면 재검색
  const handleResearch = () => {
    const trimmed = localQuery.trim();
    if (!trimmed) return;
    setActiveQuery(trimmed);
  };

  useEffect(() => {
    const trimmed = activeQuery.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      setTrackResults([]);
      setSearchError(null);
      return;
    }

    let cancelled = false;
    setIsSearching(true);
    setSearchError(null);

    fetch(`/api/music-search?q=${encodeURIComponent(trimmed)}`)
      .then(async (response) => {
        if (!response.ok) {
          const body = await response.json().catch(() => null);
          throw new Error(body?.error || '검색 중 문제가 생겼어요. 다시 시도해주세요.');
        }
        return response.json();
      })
      .then((data) => {
        if (cancelled) return;
        setTrackResults((data.tracks ?? []) as TrackResult[]);
      })
      .catch((error) => {
        if (cancelled) return;
        console.error('[SearchResultsView] 곡 검색 실패:', error);
        setTrackResults([]);
        setSearchError(error instanceof Error ? error.message : '검색 중 문제가 생겼어요. 다시 시도해주세요.');
      })
      .finally(() => {
        if (!cancelled) setIsSearching(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeQuery]);

  return (
    <div className="-mx-4 px-4 pb-[calc(var(--playlist-bottom-space,204px)+env(safe-area-inset-bottom))] transition-[padding-bottom] duration-300 ease-out">
      {/* 고정 헤더 — 게시글 목록을 세로로 스크롤해도 항상 상단에 유지됨 */}
      <div className="sticky -top-6 -mt-6 z-[100] bg-surface/90 backdrop-blur-xl pt-6 -mx-4 px-4 rounded-b-xl border-b border-slate-200/50 shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
        <MiscSubViewHeader
          title="검색 결과"
          emoji="🔍"
          subtitle={`"${activeQuery}"`}
          onBack={onBack}
        />
      </div>

      {/* 검색바: 검색어를 수정하고 Enter나 화살표 버튼을 누르면 이 화면 안에서 재검색 */}
      <div className="mt-4 mb-4 flex items-center gap-2 px-3.5 h-11 bg-white border border-slate-200 rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.03)] focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(14,74,132,0.1)] transition-all">
        <Search size={16} className="text-text-hint flex-shrink-0" />
        <input
          type="text"
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleResearch();
          }}
          placeholder="곡 제목이나 아티스트로 검색해보세요"
          className="flex-1 min-w-0 bg-transparent text-sm text-text-main placeholder-text-hint outline-none"
        />
        <button
          onClick={handleResearch}
          disabled={!localQuery.trim()}
          aria-label="검색"
          className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full text-text-sub disabled:text-text-hint hover:bg-slate-100 transition-colors active:scale-90"
        >
          <ArrowRight size={16} />
        </button>
      </div>

      {/* 1. Spotify 곡 검색 결과 — 가로 스크롤 */}
      <section className="mb-5">
        <h3 className="text-lg font-bold text-text-main mb-2">곡</h3>
        <div className="overflow-x-auto -mx-4 px-4 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <div className="flex gap-3 pb-2">
            {isSearching ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-28">
                  <div className="w-28 aspect-square rounded-lg bg-slate-200 animate-pulse" />
                  <div className="mt-1.5 h-3.5 w-20 rounded-full bg-slate-200 animate-pulse" />
                  <div className="mt-1.5 h-3 w-14 rounded-full bg-slate-200 animate-pulse" />
                </div>
              ))
            ) : searchError ? (
              <p className="text-xs text-text-hint py-2">{searchError}</p>
            ) : trackResults.length === 0 ? (
              <p className="text-xs text-text-hint py-2">검색 결과가 없어요</p>
            ) : (
              trackResults.map((track) => (
                <div
                  key={track.trackId}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectTrack(track)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') onSelectTrack(track);
                  }}
                  aria-label={`${track.title} 추천 게시글 보기`}
                  className="flex-shrink-0 w-28 text-left active:scale-95 transition-transform cursor-pointer"
                >
                  <div className="relative">
                    <img
                      src={track.albumArtUrl}
                      alt={track.title}
                      className="w-28 aspect-square rounded-lg object-cover shadow-md bg-slate-100"
                    />
                    {track.trackId !== currentTrackId && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPlay(track);
                        }}
                        aria-label={`${track.title} 재생`}
                        className="absolute inset-0 flex items-center justify-center active:scale-95 transition-transform"
                      >
                        <span className="w-[34%] aspect-square rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center">
                          <Play className="w-1/2 h-1/2 text-white" fill="white" stroke="white" strokeWidth={1} />
                        </span>
                      </button>
                    )}
                  </div>
                  <div className="mt-1.5 text-sm font-semibold text-text-main truncate">{track.title}</div>
                  <div className="text-xs text-text-sub truncate">{track.artist}</div>
                </div>
              ))
            )}
            <div className="w-1 flex-shrink-0" aria-hidden="true" />
          </div>
        </div>
      </section>

      <div className="border-t border-slate-200 mb-5" />

      {/* 2. 우리 서비스에 등록된 게시글 — 세로 스크롤 */}
      <section>
        <h3 className="text-lg font-bold text-text-main mb-2">게시글</h3>
        <div className="flex flex-col gap-1">
          {isSearchingPosts ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-3 bg-white rounded-card border border-slate-200">
                <div className="w-14 h-14 rounded-lg bg-slate-200 animate-pulse flex-shrink-0" />
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="h-3.5 w-2/3 rounded-full bg-slate-200 animate-pulse" />
                  <div className="h-3 w-1/3 rounded-full bg-slate-200 animate-pulse" />
                </div>
              </div>
            ))
          ) : activeQuery.trim().length < MIN_QUERY_LENGTH ? (
            <p className="text-xs text-text-hint py-2">최소 {MIN_QUERY_LENGTH}자 이상 입력해주세요!</p>
          ) : !postResults || postResults.length === 0 ? (
            <p className="text-xs text-text-hint py-2">검색 결과가 없어요</p>
          ) : (
            postResults.map((post) => (
              <div
                key={post.id ?? post.trackId}
                role="button"
                tabIndex={0}
                onClick={() => onSelectPost(post)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') onSelectPost(post);
                }}
                aria-label="게시글 상세 보기"
                className="flex items-center gap-3 px-3 py-3 bg-white rounded-card border border-slate-200 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.03),0_8px_10px_-6px_rgba(0,0,0,0.03)] hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer"
              >
                <img
                  src={post.albumArtUrl}
                  alt={post.title}
                  className="w-14 h-14 rounded-lg object-cover flex-shrink-0 bg-slate-100"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-text-main truncate">{post.title}</div>
                  <div className="text-xs text-text-sub truncate">{post.artist}</div>
                  <p className="mt-1 text-xs text-text-sub line-clamp-2">{post.comment}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
