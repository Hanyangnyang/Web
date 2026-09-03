import { ChevronRight, Pause, Play } from 'lucide-react';
import { useState } from 'react';
import { MiscSubViewHeader } from '../../misc/MiscSubViewHeader';
import { type Song, type TrackSummary } from '../playlistTypes';
import { useSongSearch } from '../../../hooks/playlist/useSongSearch.js';
import { useMusicSearch } from '../../../hooks/playlist/useMusicSearch.js';
import { RecentSongRow } from '../shared/RecentSongRow';
import { PlaylistSearchBar } from '../shared/PlaylistSearchBar';
import { EmptyMessageCard } from './EmptyMessageCard';

interface SearchResultsViewProps {
  query: string;
  onBack: () => void;
  onSelectTrack: (track: TrackSummary) => void;
  onSelectPost: (post: Song) => void;
  // 곡 검색 결과의 앨범커버를 눌렀을 때 하단 플레이어로 재생
  onPlay: (track: TrackSummary) => void;
  // 지금 하단 플레이어에서 재생 중인 곡 — 해당 카드의 재생 아이콘이 일시정지 아이콘으로 바뀜
  currentTrackId?: string | null;
}

const MIN_QUERY_LENGTH = 2;

// 검색 결과 화면 — 곡 검색은 Spotify 검색 API(/api/music-search), 게시글 검색은 BE 추천글 통합 검색 API 연동 완료
export function SearchResultsView({ query, onBack, onSelectTrack, onSelectPost, onPlay, currentTrackId }: SearchResultsViewProps) {
  // 처음 진입 시 검색어(query prop)로 시작하고, 이 화면 안에서 재검색하면 activeQuery만 갱신 —
  // query prop 자체는 부모(PlaylistView)의 홈 검색바 상태라 건드리지 않음
  const [activeQuery, setActiveQuery] = useState(query);
  const { data: postResults, isLoading: isSearchingPosts } = useSongSearch(activeQuery);
  const [localQuery, setLocalQuery] = useState(query);
  const { data: trackResultsData, isFetching: isSearching, error: musicSearchError } = useMusicSearch(activeQuery);
  const trackResults: TrackSummary[] = trackResultsData ?? [];
  const searchError = musicSearchError?.message ?? null;

  // 검색바에서 Enter를 치거나 화살표 버튼을 누르면 재검색
  const handleResearch = () => {
    const trimmed = localQuery.trim();
    if (!trimmed) return;
    setActiveQuery(trimmed);
  };

  return (
    <div className="-mx-4 px-4 pb-[calc(var(--playlist-bottom-space,204px)+env(safe-area-inset-bottom))] transition-[padding-bottom] duration-300 ease-out">
      {/* 고정 헤더 — 게시글 목록을 세로로 스크롤해도 항상 상단에 유지됨 */}
      <div className="sticky -top-6 -mt-6 z-[100] bg-surface/90 backdrop-blur-xl pt-6 -mx-4 px-4 rounded-b-xl border-b border-slate-200/50 shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
        <MiscSubViewHeader
          title="검색 결과"
          emoji="🔍"
          subtitle={`"${activeQuery}"에 대한 검색 결과`}
          onBack={onBack}
        />
      </div>

      {/* 검색바: 검색어를 수정하고 Enter나 화살표 버튼을 누르면 이 화면 안에서 재검색 */}
      <PlaylistSearchBar
        value={localQuery}
        onChange={setLocalQuery}
        onSubmit={handleResearch}
        placeholder="곡 제목이나 아티스트로 검색해보세요"
        className="mt-4 mb-4"
      />

      {/* 1. Spotify 곡 검색 결과 — 가로 스크롤 */}
      <section className="mb-3">
        <h3 className="text-lg font-bold text-text-main mb-2">곡</h3>
        <div className="overflow-x-auto -mx-4 px-4 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <div className="flex gap-3 pb-2">
            {activeQuery.trim().length < MIN_QUERY_LENGTH ? (
              <EmptyMessageCard message={`최소 ${MIN_QUERY_LENGTH}자 이상 입력해주세요!`} />
            ) : isSearching ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-36 rounded-xl border border-slate-200 bg-white overflow-hidden">
                  <div className="w-full aspect-square skeleton-shimmer" />
                  <div className="px-2 py-1.5">
                    <div className="h-3.5 w-24 rounded-full skeleton-shimmer" />
                    <div className="mt-1.5 h-3 w-16 rounded-full skeleton-shimmer" />
                  </div>
                </div>
              ))
            ) : searchError ? (
              <EmptyMessageCard message={searchError} />
            ) : trackResults.length === 0 ? (
              <EmptyMessageCard message="검색 결과가 없어요" />
            ) : (
              trackResults.map((track) => (
                <div
                  key={track.trackId}
                  // 앨범커버 좌우 모서리를 그대로 내려그은 것처럼, 카드 전체를 앨범커버 폭에 맞춰 테두리로 감쌈
                  className="flex-shrink-0 w-36 rounded-xl border border-slate-200 bg-white overflow-hidden"
                >
                  {/* 앨범커버 — 눌러서 바로 재생 */}
                  <button
                    onClick={() => onPlay(track)}
                    aria-label={track.trackId === currentTrackId ? `${track.title} 일시정지` : `${track.title} 재생`}
                    className="relative block w-full active:scale-95 transition-transform"
                  >
                    <img
                      src={track.albumArtUrl}
                      alt={track.title}
                      className="w-full aspect-square object-cover bg-slate-100"
                    />
                    {/* 재생/일시정지 아이콘 — 버튼이 이미 앨범커버 전체를 감싸고 있어 별도 버튼이 아니라 장식용 오버레이임 */}
                    <span className="absolute inset-0 m-auto w-[22%] aspect-square rounded-full bg-white/30 backdrop-blur-md border border-white/40 shadow-md flex items-center justify-center">
                      {track.trackId === currentTrackId ? (
                        <Pause className="w-1/2 h-1/2 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.45)]" fill="white" stroke="white" strokeWidth={1} />
                      ) : (
                        <Play className="w-1/2 h-1/2 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.45)]" fill="white" stroke="white" strokeWidth={1} />
                      )}
                    </span>
                  </button>
                  {/* 하단 흰색 영역 — 눌러서 이 곡의 게시글 모음으로 이동 */}
                  <button
                    onClick={() => onSelectTrack(track)}
                    aria-label={`${track.title} 추천 게시글 보기`}
                    className="w-full px-2 py-1.5 flex items-center gap-1 text-left hover:bg-slate-50 active:bg-slate-100 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-text-main truncate">{track.title}</div>
                      <div className="text-xs text-text-sub truncate">{track.artist}</div>
                    </div>
                    {/* 곡명/가수명 옆 빈 공간에 카드를 누르면 게시글 모음으로 넘어간다는 걸 알려주는 화살표 */}
                    <ChevronRight size={14} className="text-text-hint flex-shrink-0" strokeWidth={2.5} />
                  </button>
                </div>
              ))
            )}
            <div className="w-1 flex-shrink-0" aria-hidden="true" />
          </div>
        </div>
      </section>

      <div className="border-t border-slate-200 mb-3" />

      {/* 2. 우리 서비스에 등록된 게시글 — 세로 스크롤 */}
      <section>
        <h3 className="text-lg font-bold text-text-main mb-2">게시글</h3>
        <div className="flex flex-col gap-1.5">
          {isSearchingPosts ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2.5 bg-white rounded-card border border-slate-200 shadow-[0_2px_4px_rgba(0,0,0,0.03)]">
                <div className="w-12 h-12 rounded skeleton-shimmer flex-shrink-0" />
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="h-3.5 w-2/3 rounded-full skeleton-shimmer" />
                  <div className="h-3 w-1/3 rounded-full skeleton-shimmer" />
                </div>
              </div>
            ))
          ) : activeQuery.trim().length < MIN_QUERY_LENGTH ? (
            <EmptyMessageCard message={`최소 ${MIN_QUERY_LENGTH}자 이상 입력해주세요!`} />
          ) : !postResults || postResults.length === 0 ? (
            <EmptyMessageCard message="검색 결과가 없어요" />
          ) : (
            postResults.map((post) => (
              <RecentSongRow
                key={post.id ?? post.trackId}
                song={post}
                onSelect={onSelectPost}
                onPlay={onPlay}
                currentTrackId={currentTrackId}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
}
