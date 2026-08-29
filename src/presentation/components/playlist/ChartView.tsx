import { useState } from 'react';
import { MiscSubViewHeader } from '../misc/MiscSubViewHeader';
import { ChartSongRow } from './ChartSongRow';
import { EmptyGenreState } from './EmptyGenreState';
import { type Song, type ChartPeriod, CHART_PERIOD_OPTIONS } from './playlistTypes';

interface ChartViewProps {
  chart: Song[];
  onBack: () => void;
  onShowAddSong: () => void;
  onPlay: (song: Song) => void;
  onShowPosts: (song: Song) => void;
}

// 인기차트 상세 화면 — 홈 미리보기(최대 10곡)와 달리 전체 차트를 보여줌. 기간별 재집계 로직은 추후 연동
export function ChartView({ chart, onBack, onShowAddSong, onPlay, onShowPosts }: ChartViewProps) {
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('weekly');

  return (
    <div className="pb-[calc(var(--playlist-bottom-space,204px)+env(safe-area-inset-bottom))]">
      <MiscSubViewHeader
        title="인기차트"
        emoji="🔥"
        subtitle="에리카생들이 가장 많이 들은 곡"
        onBack={onBack}
      />

      {/* 기간 필터 칩 */}
      <div className="flex gap-2 mb-3">
        {CHART_PERIOD_OPTIONS.map((option) => (
          <button
            key={option.key}
            onClick={() => setChartPeriod(option.key)}
            className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-all duration-200 active:scale-[0.96] ${
              chartPeriod === option.key
                ? 'bg-[#2B3B52] text-white border-transparent shadow-[0_4px_10px_rgba(43,59,82,0.35)]'
                : 'bg-white text-[#2B3B52] border-[#2B3B52]'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* 차트 리스트 */}
      <div className="bg-white rounded-card border border-slate-200 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.03),0_8px_10px_-6px_rgba(0,0,0,0.03)] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center gap-3 px-3 py-3 border-b border-slate-200 font-semibold text-xs text-gray-600 bg-slate-50">
          <span className="w-7 text-center">순위</span>
          <div className="flex-1">곡정보</div>
          <div className="w-6 text-center">듣기</div>
        </div>

        {/* 리스트 */}
        {chart.length === 0 ? (
          <EmptyGenreState onShowAddSong={onShowAddSong} />
        ) : (
          chart.map((song, index) => (
            <ChartSongRow
              key={song.trackId}
              song={song}
              rank={index + 1}
              onPlay={onPlay}
              onShowPosts={onShowPosts}
            />
          ))
        )}
      </div>
    </div>
  );
}
