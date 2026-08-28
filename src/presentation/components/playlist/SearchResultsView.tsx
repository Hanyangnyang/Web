import { ArrowRight, Search } from 'lucide-react';
import { useState } from 'react';
import { MiscSubViewHeader } from '../misc/MiscSubViewHeader';

interface SearchResultsViewProps {
  query: string;
  onBack: () => void;
  onSelectTrack: (track: TrackResult) => void;
  onSelectPost: (post: SongPostResult) => void;
}

export interface TrackResult {
  trackId: string;
  title: string;
  artist: string;
  albumArtUrl: string;
}

export interface SongPostResult {
  trackId: string;
  title: string;
  artist: string;
  albumArtUrl: string;
  body: string;
}

// UI 디자인용 임시 더미 — 실제로는 Spotify 검색 API 응답으로 교체될 예정
const DUMMY_TRACK_RESULTS: TrackResult[] = [
  { trackId: 't1', title: 'Busy Boy', artist: '주혜린', albumArtUrl: 'https://i.scdn.co/image/ab67616d0000b273951f05b855b09c8b4d7d2ee5' },
  { trackId: 't2', title: 'LOVE SONG', artist: '유다빈밴드', albumArtUrl: 'https://i.scdn.co/image/ab67616d0000b273fd07915694e0ffb3b961a7b5' },
  { trackId: 't3', title: '초록', artist: '윤마치', albumArtUrl: 'https://i.scdn.co/image/ab67616d0000b273da16a8d501f1621068b0ea8b' },
  { trackId: 't4', title: 'Fly away', artist: '권진아', albumArtUrl: 'https://i.scdn.co/image/ab67616d0000b273bee4779793a1d10af6e8bd4f' },
];

// UI 디자인용 임시 더미 — 실제로는 BE에 등록된 게시글 조회 API 응답으로 교체될 예정
const DUMMY_POST_RESULTS: SongPostResult[] = [
  {
    trackId: 'p1',
    title: 'Busy Boy',
    artist: '주혜린',
    albumArtUrl: 'https://i.scdn.co/image/ab67616d0000b273951f05b855b09c8b4d7d2ee5',
    body: '이 노래 진짜 좋아! 베이스 라인이 미쳤어, 이런 감성의 R&B는 진짜 오랜만이에요 ㅠㅠ',
  },
  {
    trackId: 'p2',
    title: '다큐멘터리',
    artist: '윤마치',
    albumArtUrl: 'https://i.scdn.co/image/ab67616d0000b2734c02aacdf6281db79169e115',
    body: '가사도 멜로디도 감성 만렙이라 듣자마자 바로 플레이리스트 맨 위에 올려놨어요 💯',
  },
  {
    trackId: 'p3',
    title: '마음으로',
    artist: '유다빈밴드',
    albumArtUrl: 'https://i.scdn.co/image/ab67616d0000b273598f97c45eee469199fd0733',
    body: '아침에 일어나서부터 밤에 잠들 때까지 하루종일 이 노래만 듣고 있는 것 같아요',
  },
];

// 검색 결과 화면 — UI 레이아웃만 우선 구현. 실제 Spotify 검색/BE 게시글 조회 로직은 추후 연결
export function SearchResultsView({ query, onBack, onSelectTrack, onSelectPost }: SearchResultsViewProps) {
  const [localQuery, setLocalQuery] = useState(query);

  return (
    <div className="-mx-4 px-4 pb-[calc(204px+env(safe-area-inset-bottom))]">
      {/* 고정 헤더 — 게시글 목록을 세로로 스크롤해도 항상 상단에 유지됨 */}
      <div className="sticky -top-6 -mt-6 z-[100] bg-surface/90 backdrop-blur-xl pt-6 -mx-4 px-4 rounded-b-xl border-b border-slate-200/50 shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
        <MiscSubViewHeader
          title="검색 결과"
          emoji="🔍"
          subtitle={`"${query}"`}
          onBack={onBack}
        />
      </div>

      {/* 검색바: 사용자가 검색했던 텍스트를 보여줌. 재검색 로직은 추후 구현 */}
      <div className="mt-4 mb-4 flex items-center gap-2 px-3.5 h-11 bg-white border border-slate-200 rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.03)] focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(14,74,132,0.1)] transition-all">
        <Search size={16} className="text-text-hint flex-shrink-0" />
        <input
          type="text"
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          placeholder="곡 제목이나 아티스트로 검색해보세요"
          className="flex-1 min-w-0 bg-transparent text-sm text-text-main placeholder-text-hint outline-none"
        />
        <button
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
            {DUMMY_TRACK_RESULTS.map((track) => (
              <button
                key={track.trackId}
                onClick={() => onSelectTrack(track)}
                aria-label={`${track.title} 추천 게시글 보기`}
                className="flex-shrink-0 w-28 text-left active:scale-95 transition-transform"
              >
                <img
                  src={track.albumArtUrl}
                  alt={track.title}
                  className="w-28 aspect-square rounded-lg object-cover shadow-md bg-slate-100"
                />
                <div className="mt-1.5 text-sm font-semibold text-text-main truncate">{track.title}</div>
                <div className="text-xs text-text-sub truncate">{track.artist}</div>
              </button>
            ))}
            <div className="w-1 flex-shrink-0" aria-hidden="true" />
          </div>
        </div>
      </section>

      <div className="border-t border-slate-200 mb-5" />

      {/* 2. 우리 서비스에 등록된 게시글 — 세로 스크롤 */}
      <section>
        <h3 className="text-lg font-bold text-text-main mb-2">게시글</h3>
        <div className="flex flex-col gap-1">
          {DUMMY_POST_RESULTS.map((post) => (
            <div
              key={post.trackId}
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
                <p className="mt-1 text-xs text-text-sub line-clamp-2">{post.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
