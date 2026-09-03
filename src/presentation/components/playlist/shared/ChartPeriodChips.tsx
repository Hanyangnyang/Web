import { type ChartPeriod, CHART_PERIOD_OPTIONS } from '../playlistTypes';

interface ChartPeriodChipsProps {
  chartPeriod: ChartPeriod;
  onChangePeriod: (period: ChartPeriod) => void;
  className?: string;
}

// 인기차트 기간 필터 칩 — 멜론 차트 탭(TOP100/HOT100)처럼 알약형으로 크게. 홈 미리보기와
// 인기차트 전체보기 화면이 동일한 마크업을 공유
export function ChartPeriodChips({ chartPeriod, onChangePeriod, className = '' }: ChartPeriodChipsProps) {
  return (
    <div className={`flex gap-2 mb-2 ${className}`}>
      {CHART_PERIOD_OPTIONS.map((option) => (
        <button
          key={option.key}
          onClick={() => onChangePeriod(option.key)}
          className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all duration-200 active:scale-[0.96] ${
            chartPeriod === option.key
              ? 'bg-playlist-primary text-white border-transparent shadow-[0_4px_10px_rgba(15,23,42,0.35)]'
              : 'bg-white text-playlist-primary border-playlist-primary'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
