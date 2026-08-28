import { Heart, MoreVertical, Play } from 'lucide-react';
import { useState } from 'react';
import { MiscSubViewHeader } from '../misc/MiscSubViewHeader';
import { type TrackResult } from './SearchResultsView';

interface TrackPostsViewProps {
  track: TrackResult;
  onBack: () => void;
  onSelectPost: (post: TrackPost) => void;
  onPlay: () => void;
  // 지금 이 곡이 하단 플레이어에서 재생 중인지 — true면 재생 버튼을 숨김
  isPlaying?: boolean;
}

export interface TrackPost {
  id: string;
  body: string;
  createdAt: Date;
  heartCount: number;
}

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const MONTH_MS = 30 * DAY_MS;
const YEAR_MS = 12 * MONTH_MS;

function formatTimeAgo(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  if (diffMs < MINUTE_MS) return '방금 전';
  if (diffMs < HOUR_MS) return `${Math.floor(diffMs / MINUTE_MS)}분 전`;
  if (diffMs < DAY_MS) return `${Math.floor(diffMs / HOUR_MS)}시간 전`;
  if (diffMs < MONTH_MS) return `${Math.floor(diffMs / DAY_MS)}일 전`;
  if (diffMs < YEAR_MS) return `${Math.floor(diffMs / MONTH_MS)}달 전`;
  return `${Math.floor(diffMs / YEAR_MS)}년 전`;
}

const SORT_OPTIONS = [
  { key: 'latest', label: '최신' },
  { key: 'popular', label: '인기' },
] as const;

// UI 디자인용 임시 더미 — 실제로는 BE에서 이 곡(trackId)에 달린 게시글 조회 API 응답으로 교체될 예정
const DUMMY_POSTS: TrackPost[] = [
  { id: 'post1', body: '이 노래 진짜 좋아! 베이스 라인이 미쳤어, 이런 감성의 R&B는 진짜 오랜만이에요 ㅠㅠ', createdAt: new Date(Date.now() - 5 * MINUTE_MS), heartCount: 12 },
  { id: 'post2', body: '자기 전에 이 노래 틀어놓고 잠드는 게 요즘 하루 마무리 루틴이에요, 반복 재생 중...', createdAt: new Date(Date.now() - 3 * HOUR_MS), heartCount: 34 },
  { id: 'post3', body: '가사도 멜로디도 감성 만렙이라 듣자마자 바로 플레이리스트 맨 위에 올려놨어요 💯 요즘 계속 듣는 중이에요', createdAt: new Date(Date.now() - 2 * DAY_MS), heartCount: 8 },
  { id: 'post4', body: '오랜만에 나온 진짜 명곡이라 주변 사람들한테도 자꾸 추천하고 다니게 되는 곡이에요', createdAt: new Date(Date.now() - 1 * MONTH_MS), heartCount: 21 },
];

// 곡 단위 게시글 목록 화면 — 앨범커버 + 최신/인기 정렬 칩 + 게시글 리스트. 정렬 로직/API 연동은 추후 작업
export function TrackPostsView({ track, onBack, onSelectPost, onPlay, isPlaying = false }: TrackPostsViewProps) {
  const [sort, setSort] = useState<(typeof SORT_OPTIONS)[number]['key']>('latest');
  const [heartedIds, setHeartedIds] = useState<Set<string>>(new Set());

  const toggleHeart = (id: string) => {
    setHeartedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="pb-[calc(204px+env(safe-area-inset-bottom))]">
      <MiscSubViewHeader
        title="에리카 플레이리스트"
        emoji="🕺"
        subtitle="에리카생들에게 곡을 추천해주세요!"
        onBack={onBack}
      />

      {/* 곡 정보 — 하얀색 카드로 감싸 아래 정렬 칩과 구분 */}
      <div className="flex items-stretch gap-3 mb-4 p-3 bg-white rounded-card border border-slate-200 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.03),0_8px_10px_-6px_rgba(0,0,0,0.03)]">
        <img
          src={track.albumArtUrl}
          alt={track.title}
          className="w-1/2 aspect-square rounded-xl object-cover bg-slate-100 flex-shrink-0"
        />
        <div className="min-w-0 flex-1 flex flex-col justify-between py-1">
          <div>
            <div className="text-lg font-bold text-text-main truncate">{track.title}</div>
            <div className="text-sm text-text-sub truncate">{track.artist}</div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-sub">게시글 {DUMMY_POSTS.length}개</span>
            {!isPlaying && (
              <button
                onClick={onPlay}
                aria-label={`${track.title} 재생`}
                className="w-7 h-7 rounded-full bg-slate-700 text-white flex items-center justify-center active:scale-90 transition-transform"
              >
                <Play size={13} fill="white" stroke="white" strokeWidth={1} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 정렬 칩 */}
      <div className="flex gap-2 mb-3">
        {SORT_OPTIONS.map((option) => (
          <button
            key={option.key}
            onClick={() => setSort(option.key)}
            className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-all duration-200 active:scale-[0.96] ${
              sort === option.key
                ? 'bg-slate-700 text-white border-transparent shadow-[0_2px_6px_rgba(51,65,85,0.25)]'
                : 'bg-slate-200 text-slate-800 border-slate-400'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* 게시글 리스트 — 카드 사이 간격을 둬서 항목마다 분리된 느낌 */}
      <div className="flex flex-col gap-1">
        {DUMMY_POSTS.map((post) => {
          const hearted = heartedIds.has(post.id);
          const displayedHeartCount = post.heartCount + (hearted ? 1 : 0);
          return (
            <div
              key={post.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelectPost(post)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onSelectPost(post);
              }}
              aria-label="게시글 상세 보기"
              className="flex items-start gap-3 px-3.5 py-3 bg-white rounded-card border border-slate-200 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.03),0_8px_10px_-6px_rgba(0,0,0,0.03)] hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm text-text-main leading-snug line-clamp-2">{post.body}</p>
                <div className="mt-1.5 text-xs text-text-hint">{formatTimeAgo(post.createdAt)}</div>
              </div>

              <div className="flex items-start gap-3 flex-shrink-0 pt-0.5">
                <div className="flex flex-col items-center gap-0.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleHeart(post.id);
                    }}
                    aria-label="이 게시글 좋아요"
                    className="active:scale-90 transition-transform"
                  >
                    <Heart
                      size={18}
                      className={hearted ? 'text-red-500' : 'text-text-sub'}
                      fill={hearted ? 'currentColor' : 'none'}
                      strokeWidth={2}
                    />
                  </button>
                  <span className="text-[10px] text-text-hint">{displayedHeartCount}</span>
                </div>
                {/* 더보기 버튼: 동작은 추후 구현 */}
                <button
                  onClick={(e) => e.stopPropagation()}
                  aria-label="더보기"
                  className="active:scale-90 transition-transform"
                >
                  <MoreVertical size={18} className="text-text-sub" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
