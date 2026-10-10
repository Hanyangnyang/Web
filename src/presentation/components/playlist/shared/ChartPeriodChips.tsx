import { type ChartPeriod, CHART_PERIOD_OPTIONS } from '../playlistTypes';
import { CHIP_ACTIVE, CHIP_BASE, CHIP_INACTIVE } from './GenreFilterChips';

interface ChartPeriodChipsProps {
  chartPeriod: ChartPeriod;
  onChangePeriod: (period: ChartPeriod) => void;
  className?: string;
}

// 인기차트 기간 필터 칩 — 장르 칩(GenreFilterChips)과 같은 모양. 홈 미리보기와
// 인기차트 전체보기 화면이 동일한 마크업을 공유
export function ChartPeriodChips({ chartPeriod, onChangePeriod, className = '' }: ChartPeriodChipsProps) {
  return (
    <div className={`flex gap-1.5 mb-2 ${className}`}>
      {CHART_PERIOD_OPTIONS.map((option) => (
        <button
          key={option.key}
          onClick={() => onChangePeriod(option.key)}
          className={`${CHIP_BASE} ${chartPeriod === option.key ? CHIP_ACTIVE : CHIP_INACTIVE}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
