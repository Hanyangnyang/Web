import { type RecentSongsTapAreaVariant } from '../../../hooks/playlist/usePlaylistExperiment';
import { type Song, type TrackSummary } from '../playlistTypes';
import { ErrorBoundary } from '../../common/ErrorBoundary.js';
import { EmptyMessageCard } from '../searchResults/EmptyMessageCard';
import { PlaylistFallback } from './PlaylistFallback';
import { RecentSongRow } from './RecentSongRow';
import { SongRowSkeleton } from './SongRowSkeleton';

// 최근 추가된 곡 섹션에서 보여줄 개수
const RECENT_PREVIEW_LIMIT = 3;

interface RecentSongsPreviewSectionProps {
  onShowRecent: () => void; // 제목/"더보기" — 최근 추가된 곡 전체보기로 이동
  recentSongs: Song[]; // 앞의 RECENT_PREVIEW_LIMIT개만 사용
  isLoading: boolean;
  onSelectRecentSong: (song: Song) => void; // 행(앨범커버 이외 영역) 클릭 — 전체보기로 이동하며 그 곡으로 스크롤
  onPlay: (track: TrackSummary) => void;
  currentTrackId?: string | null;
  variant?: RecentSongsTapAreaVariant; // 홈 미리보기와 같은 재생 인터랙션 A/B 배정
}

// 검색 결과·게시글 모음 화면 하단에 공통으로 붙는 "최근 추가된 곡" 섹션(제목은 "하냥이들이 어떤 곡들을 추천했을까요?") — 홈의 미리보기와 같은 행 UI, 3개만 보여주고 더보기로 전체보기 이동
export function RecentSongsPreviewSection({ onShowRecent, recentSongs, isLoading, onSelectRecentSong, onPlay, currentTrackId, variant = 'control' }: RecentSongsPreviewSectionProps) {
  return (
    <section>
      <h3 className="mb-2 text-base font-bold text-text-main">하냥이들은 어떤 곡을 추천했을까요?</h3>
      <ErrorBoundary
        name="playlist-recent-preview"
        fallback={<PlaylistFallback message="최근 추가된 곡을 표시할 수 없어요" />}
      >
      <div className="flex flex-col gap-1.5">
        {isLoading ? (
          Array.from({ length: RECENT_PREVIEW_LIMIT }).map((_, i) => (
            <SongRowSkeleton key={i} className="bg-white rounded-card border border-slate-200 shadow-[0_2px_4px_rgba(0,0,0,0.03)]" />
          ))
        ) : recentSongs.length === 0 ? (
          <EmptyMessageCard message="아직 추가된 곡이 없어요" />
        ) : (
          recentSongs.slice(0, RECENT_PREVIEW_LIMIT).map((song) => (
            <RecentSongRow
              key={song.id ?? song.trackId}
              song={song}
              onSelect={onSelectRecentSong}
              onPlay={onPlay}
              currentTrackId={currentTrackId}
              variant={variant}
            />
          ))
        )}
      </div>
      </ErrorBoundary>

      {!isLoading && recentSongs.length > 0 && (
        <div className="flex justify-center mt-3">
          <button
            type="button"
            onClick={onShowRecent}
            className="px-5 py-2.5 rounded-full text-xs font-bold text-text-sub bg-white border border-slate-200 shadow-[0_2px_4px_rgba(0,0,0,0.03)] hover:bg-slate-50 hover:text-text-main transition-colors active:scale-95"
          >
            더보기
          </button>
        </div>
      )}
    </section>
  );
}
