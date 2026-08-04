// 컴포넌트: 일반버스 도착정보 한 칸 (첫 번째/두 번째 도착 둘 다 이 컴포넌트로 렌더)
import type { TickingBusArrival } from '../../../domain/entities/PublicBus.js';

interface BusArrivalSlotProps {
  arrival: TickingBusArrival | undefined;
}

export function BusArrivalSlot({ arrival }: BusArrivalSlotProps) {
  if (!arrival) {
    return (
      <div className="flex items-center justify-end w-full h-[26px]">
        <span className="text-[11px] font-medium text-text-hint pr-1">도착정보 없음</span>
      </div>
    );
  }

  const parts = arrival.info ? arrival.info.split('·') : [];
  const beforeStr = parts[0] || '';
  const seatStr = parts[1] || '';

  // 10석 이하 또는 혼잡 여부 판단
  let isAlert = false;
  if (seatStr) {
    const match = seatStr.match(/(\d+)석/);
    if (match) {
      const seatNum = parseInt(match[1], 10);
      if (seatNum <= 10) {
        isAlert = true;
      }
    } else if (seatStr.includes('혼잡')) {
      isAlert = true;
    }
  }

  const isArrivingSoon = arrival.seconds < 60;
  const timeText = isArrivingSoon ? '잠시 후 도착' : `${Math.floor(arrival.seconds / 60)}분`;

  return (
    <div className="flex items-center justify-between w-full h-[26px]">
      <span className={`font-bold tracking-tight text-[#DE5B5B] w-[94px] text-right truncate ${isArrivingSoon ? 'text-[15px]' : 'text-[17px]'}`}>
        {timeText}
      </span>
      {arrival.info ? (
        <span className="text-[10px] font-bold text-text-sub bg-slate-100 px-1 py-0.5 rounded flex gap-1 justify-center w-[82px] shrink-0 whitespace-nowrap">
          <span>{beforeStr}</span>
          {seatStr && (
            <span
              className="font-extrabold"
              style={{ color: isAlert ? '#DE5B5B' : '#3b82f6' }}
            >
              {seatStr}
            </span>
          )}
        </span>
      ) : (
        <div className="w-[82px] shrink-0" />
      )}
    </div>
  );
}
