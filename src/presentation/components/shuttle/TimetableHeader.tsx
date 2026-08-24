// 컴포넌트: 셔틀 시간표 헤더 (기간/요일 선택기 + 지하철 노선 드롭다운 + 카카오 지하철 링크 + 전체시간표 토글)
import { ExternalLink } from 'lucide-react';
import type { ShuttleAppConfig } from '../../../domain/entities/Shuttle.js';
import { PeriodDayTypeSelector } from './PeriodDayTypeSelector.jsx';
import { SubwayDropdown } from './SubwayDropdown.jsx';

interface TimetableHeaderProps {
  isFullMode: boolean;
  fullPeriod: string;
  setFullPeriod: (period: string) => void;
  fullDayType: string;
  setFullDayType: (dayType: string) => void;
  appConfig: ShuttleAppConfig;
  isWeekend: boolean;
  needsSubway: boolean;
  hideSubwayCol: boolean;
  lineId: string;
  setLineId: (lineId: string) => void;
  onOpenSubway: () => void;
  onToggleFullMode: () => void;
}

export function TimetableHeader({
  isFullMode, fullPeriod, setFullPeriod, fullDayType, setFullDayType,
  appConfig, isWeekend, needsSubway, hideSubwayCol,
  lineId, setLineId, onOpenSubway, onToggleFullMode,
}: TimetableHeaderProps) {
  return (
    <>
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-shrink-0 whitespace-nowrap flex items-center text-2xl font-extrabold text-text-main">시간표</div>

        <div className="flex-1 flex items-center gap-2 min-w-0 justify-end">
          <div className="shrink basis-[125px] min-w-0">
            <PeriodDayTypeSelector
              isFullMode={isFullMode}
              fullPeriod={fullPeriod}
              setFullPeriod={setFullPeriod}
              fullDayType={fullDayType}
              setFullDayType={setFullDayType}
              appConfig={appConfig}
              isWeekend={isWeekend}
            />
          </div>
          {needsSubway && (
            <div className="shrink-0 min-w-0">
              <SubwayDropdown selected={lineId} onChange={setLineId} />
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center py-0 pb-1.5 border-b border-slate-100" style={{ gap: 'clamp(6px, 3vw, 16px)', paddingRight: 8 }}>
        {!hideSubwayCol && (
          needsSubway ? (
            <button
              onClick={onOpenSubway}
              className="ml-auto flex-shrink-0 inline-flex items-center gap-1 text-[11px] font-bold text-[#56657a] bg-[#eaeff5] rounded-lg px-2 py-1.5 active:bg-[#e2e8f0] transition-colors [-webkit-tap-highlight-color:transparent]"
            >
              카카오 지하철
              <ExternalLink size={11} strokeWidth={2.2} />
            </button>
          ) : (
            <span className="text-[10px] font-bold text-slate-300 tracking-[0.04em] flex-shrink-0" style={{ marginLeft: 'auto' }}>도착</span>
          )
        )}
        <div className={`flex items-center gap-1.5 flex-shrink-0${hideSubwayCol ? ' ml-auto' : ''}`}>
          <div
            onClick={onToggleFullMode}
            style={{ width: 38, height: 21, borderRadius: 20, padding: 2, cursor: 'pointer', background: isFullMode ? 'var(--color-primary)' : '#e0e0e0', position: 'relative', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)', flexShrink: 0 }}
          >
            <div style={{ width: 17, height: 17, borderRadius: '50%', background: 'white', boxShadow: '0 2px 3px rgba(0,0,0,0.15)', position: 'absolute', top: 2, left: isFullMode ? 19 : 2, transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }} />
          </div>
          <span style={{ fontSize: 10, fontWeight: 800, color: isFullMode ? 'var(--color-primary)' : 'var(--color-text-hint)', whiteSpace: 'nowrap' }}>
            전체 시간표
          </span>
        </div>
      </div>
    </>
  );
}
