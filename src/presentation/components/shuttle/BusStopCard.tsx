// 컴포넌트: 일반버스 정류소 하나의 아코디언 카드 (버스별 도착정보 목록 포함)
import { Star, ChevronDown, Loader2, BusFront } from 'lucide-react';
import { ALLOWED_BUSES_BY_STOP, DEFAULT_DIRECTIONS, type TickingBusArrival } from '../../../domain/entities/PublicBus.js';
import { BusArrivalSlot } from './BusArrivalSlot.jsx';

const DESC_MAP: Record<string, string> = {
  '기숙사': '기숙사 (한양대기숙사앞)',
  '융합교육관': '융합교육관 (한국생산기술연구원)',
  '셔틀콕': '셔틀콕 (한양대ERICA컨벤션센터)'
};

const DIR_MAP: Record<string, string> = {
  '의왕톨게이트': '에리카 방향',
  '상록수역': '에리카 방향',
  '셔틀콕': '강남역 방향',
  '융합교육관': '강남역 방향',
  '기숙사': '강남역 방향',
  '강남역우리은행': '에리카 방향'
};

interface BusStopCardProps {
  stopName: string;
  isExpanded: boolean;
  isFav: boolean;
  isClosest: boolean;
  arrivals: TickingBusArrival[];
  isLoading: boolean;
  hasLoadedOnce: boolean;
  onToggleExpand: (stopName: string) => void;
  onToggleFavorite: (stopName: string) => void;
}

export function BusStopCard({ stopName, isExpanded, isFav, isClosest, arrivals, isLoading, hasLoadedOnce, onToggleExpand, onToggleFavorite }: BusStopCardProps) {
  const targetBuses = ALLOWED_BUSES_BY_STOP[stopName] || [];

  return (
    <div className="bg-white border border-slate-200 rounded-card overflow-hidden shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05),0_2px_4px_-1px_rgba(0,0,0,0.03)]">
      {/* 아코디언 헤더 */}
      <div
        className="flex justify-between items-center px-4 py-2.5 cursor-pointer hover:bg-slate-50 transition-colors duration-150 select-none"
        onClick={() => onToggleExpand(stopName)}
      >
        <div className="flex items-center gap-2 min-w-0">
          {/* 즐겨찾기 별 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(stopName);
            }}
            className="p-1 -ml-1 flex items-center justify-center cursor-pointer transition-transform duration-100 active:scale-75"
          >
            <Star
              size={18}
              fill={isFav ? '#fbbf24' : 'none'}
              stroke={isFav ? '#fbbf24' : '#cbd5e1'}
              strokeWidth={2}
            />
          </button>
          <span className="font-bold text-[16px] tracking-tight text-text-main truncate">
            {DESC_MAP[stopName] || stopName}
          </span>
          <span className="text-[12px] font-medium text-text-sub ml-1 flex-shrink-0">
            {DIR_MAP[stopName] || ''}
          </span>
          {isClosest && (
            <span className="text-[10px] font-extrabold text-success bg-success/10 px-1.5 py-0.5 rounded flex-shrink-0">
              가장 근처
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isLoading && (
            <Loader2 size={14} className="text-text-hint animate-spin" />
          )}
          <ChevronDown
            size={16}
            className={`text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          />
        </div>
      </div>

      {/* 아코디언 내용 */}
      <div className={`accordion-content ${isExpanded ? 'expanded' : ''}`}>
        <div className="accordion-inner border-t border-slate-100 bg-white">
          {targetBuses.length === 0 ? (
            <p className="text-center text-xs font-semibold text-text-hint py-4">
              운행 정보가 없습니다.
            </p>
          ) : targetBuses.map((busId, idx) => {
            const busArrivalsForId = arrivals.filter(arr => arr.busId === busId);
            const firstArrival = busArrivalsForId[0];
            const secondArrival = busArrivalsForId[1];
            const directionLabel = (firstArrival && firstArrival.direction) || DEFAULT_DIRECTIONS[busId]?.[stopName] || '';
            const isInitialLoading = isLoading && !hasLoadedOnce;

            return (
              <div key={busId}>
                <div className="px-4 py-2 flex justify-between items-center">
                  {/* 왼쪽 열: 버스번호 및 행선지 */}
                  <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-5 h-5 flex items-center justify-center rounded-[4px] flex-shrink-0"
                        style={{ backgroundColor: (busId === '3102' || busId === '3100' || busId === '3101') ? '#EE2737' : busId === '8147' ? '#A2409F' : busId === '10-1' ? '#53B332' : '#94a3b8' }}
                      >
                        <BusFront
                          size={12}
                          className="text-white"
                        />
                      </div>
                      <span
                        className="text-[16px] font-bold text-slate-700"
                      >
                        {busId}
                      </span>
                    </div>
                    {isInitialLoading ? (
                      <div className="w-24 h-3 bg-slate-100 rounded animate-pulse mt-1" />
                    ) : (
                      <span className="text-[12px] font-medium text-text-sub truncate">
                        {directionLabel}
                      </span>
                    )}
                  </div>

                  {/* 오른쪽 열: 도착 정보 (첫 번째 & 두 번째) */}
                  <div className="flex flex-col items-end gap-1.5 w-[190px] flex-shrink-0">
                    {isInitialLoading ? (
                      <>
                        <div className="flex items-center justify-between w-full h-[26px] animate-pulse">
                          <div className="w-[45px] h-[14px] bg-slate-200 rounded ml-auto mr-4" />
                          <div className="w-[82px] h-[22px] bg-slate-100 rounded" />
                        </div>
                        <div className="flex items-center justify-between w-full h-[26px] animate-pulse">
                          <div className="w-[45px] h-[14px] bg-slate-200 rounded ml-auto mr-4" />
                          <div className="w-[82px] h-[22px] bg-slate-100 rounded" />
                        </div>
                      </>
                    ) : (
                      <>
                        <BusArrivalSlot arrival={firstArrival} />
                        <BusArrivalSlot arrival={secondArrival} />
                      </>
                    )}
                  </div>
                </div>
                {idx < targetBuses.length - 1 && (
                  <div className="mx-5 border-b border-dashed border-slate-200" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
