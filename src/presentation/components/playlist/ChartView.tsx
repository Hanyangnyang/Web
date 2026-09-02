import { MiscSubViewHeader } from '../misc/MiscSubViewHeader';
import { ChartSongRow } from './ChartSongRow';
import { EmptyGenreState } from './EmptyGenreState';
import { ChartPeriodChips } from './ChartPeriodChips';
import { type ChartPeriod, CHART_PERIOD_OPTIONS } from './playlistTypes';
import { type ChartTrack } from '../../../domain/entities/PopularityChart.js';

interface ChartViewProps {
  chart: ChartTrack[];
  isLoading: boolean;
  chartPeriod: ChartPeriod;
  onChangePeriod: (period: ChartPeriod) => void;
  onBack: () => void;
  onShowRecent: () => void;
  onPlay: (track: ChartTrack) => void;
  onShowPosts: (track: ChartTrack) => void;
}

// 인기차트 상세 화면 — 홈 미리보기(최대 10곡)와 달리 전체 차트를 보여줌
export function ChartView({ chart, isLoading, chartPeriod, onChangePeriod, onBack, onShowRecent, onPlay, onShowPosts }: ChartViewProps) {
  return (
    <div className="pb-[calc(var(--playlist-bottom-space,204px)+env(safe-area-inset-bottom))] transition-[padding-bottom] duration-300 ease-out">
      <MiscSubViewHeader
        title="인기차트"
        emoji="🔥"
        subtitle="에리카생들이 가장 많이 들은 곡"
        onBack={onBack}
      />

      <ChartPeriodChips chartPeriod={chartPeriod} onChangePeriod={onChangePeriod} className="pl-2" />

      {/* 차트 리스트 */}
      <div className="bg-white rounded-card border border-[#618CE9]/20 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.03),0_8px_10px_-6px_rgba(0,0,0,0.03)] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center gap-3 px-3 py-3 border-b border-slate-200 font-semibold text-xs text-gray-600 bg-slate-50">
          <span className="w-7 text-center">순위</span>
          <div className="flex-1">곡정보</div>
          <div className="flex items-center gap-3">
            <span className="w-6 text-center">듣기</span>
            <span className="w-6 text-center">공유</span>
          </div>
        </div>

        {/* 리스트 */}
        {isLoading ? (
          <div className="py-10 text-center text-sm text-text-hint">불러오는 중...</div>
        ) : chart.length === 0 ? (
          <EmptyGenreState
            message={`아직 '${CHART_PERIOD_OPTIONS.find((option) => option.key === chartPeriod)?.label ?? ''}' 차트가 집계되지 않았어요`}
            buttonLabel="최근 추가된 곡 보러가기"
            buttonIcon={<span>🎵</span>}
            onAction={onShowRecent}
          />
        ) : (
          chart.map((track) => (
            <ChartSongRow
              key={track.trackId}
              track={track}
              onPlay={onPlay}
              onShowPosts={onShowPosts}
            />
          ))
        )}
      </div>
    </div>
  );
}
