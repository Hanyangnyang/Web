import { useWheelColumn, WHEEL_ITEM_H } from '../../hooks/useWheelColumn.js';
import { WheelColumnView, WHEEL_VISIBLE } from './WheelColumnView.js';

const HOUR_LIST = Array.from({ length: 12 }, (_, i) => i);
const MINUTE_LIST = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];
const AMPM_LIST = ['오전', '오후'];
export const DAY_LIST = ['전날', '당일'];

const parseH24 = (h24: number) => ({
  displayHour: h24 % 12,
  ampmIdx: h24 < 12 ? 0 : 1,
});

const toH24 = (displayHour: number, ampmIdx: number) => (ampmIdx === 0 ? displayHour : displayHour + 12);

const labelStyle = (paddingRight: number) => ({
  display: 'flex' as const,
  alignItems: 'center' as const,
  paddingLeft: 2,
  paddingRight,
  fontSize: 13,
  fontWeight: 500,
  color: '#4b5563',
  flexShrink: 0,
  position: 'relative' as const,
});

export interface TimeDayWheelPickerProps {
  value: string; // "HH:MM"
  onChange: (value: string) => void;
  day: string;
  onDayChange: (day: string) => void;
}

// 소식탭 날씨 알람의 "시/분/오전오후/전날·당일" 4컬럼 스크롤 휠 피커.
// 시-오전오후 컬럼만 캐리오버(11시 넘어가면 오전/오후 자동 전환)로 서로 얽혀 있어
// 한 컴포넌트 안에서 두 useWheelColumn을 직접 조율한다.
export function TimeDayWheelPicker({ value, onChange, day, onDayChange }: TimeDayWheelPickerProps) {
  const [hStr, mStr] = (typeof value === 'string' ? value : '').split(':');
  const h24 = Math.max(0, Math.min(parseInt(hStr) || 0, 23));
  const initMin = String(Math.max(0, Math.min(parseInt(mStr) || 0, 55))).padStart(2, '0');
  const initMinIdx = Math.max(0, MINUTE_LIST.indexOf(initMin));
  const initDay = Math.max(0, DAY_LIST.indexOf(day));
  const { displayHour: initHour, ampmIdx: initAmpm } = parseH24(h24);

  const commitTime = () => {
    const newH24 = toH24(hour.getIndex(), ampm.getIndex());
    const newMinStr = MINUTE_LIST[min.getIndex()] || '00';
    const newTime = `${String(newH24).padStart(2, '0')}:${newMinStr}`;
    if (newTime !== value) onChange(newTime);
  };

  const hour = useWheelColumn({
    length: HOUR_LIST.length,
    activeIndex: initHour,
    onSettle: commitTime,
    onOverflow: (direction) => {
      const curAmpm = ampm.getIndex();
      if (direction === 1 && curAmpm === 0) { // 오전 11시 -> 더 아래로 -> 오후 12시(0)
        ampm.setIndex(1);
        return true;
      }
      if (direction === -1 && curAmpm === 1) { // 오후 12시(0) -> 더 위로 -> 오전 11시
        ampm.setIndex(0);
        return true;
      }
      return false;
    },
  });

  const ampm = useWheelColumn({
    length: AMPM_LIST.length,
    activeIndex: initAmpm,
    onSettle: commitTime,
  });

  const min = useWheelColumn({
    length: MINUTE_LIST.length,
    activeIndex: initMinIdx,
    onSettle: commitTime,
  });

  const commitDay = () => {
    const idx = dayCol.getIndex();
    if (DAY_LIST[idx] !== day) onDayChange(DAY_LIST[idx]);
  };

  const dayCol = useWheelColumn({
    length: DAY_LIST.length,
    activeIndex: initDay,
    onSettle: commitDay,
  });

  return (
    <div
      onMouseDown={e => e.stopPropagation()}
      onMouseMove={e => e.stopPropagation()}
      onMouseUp={e => e.stopPropagation()}
      onTouchStart={e => e.stopPropagation()}
      onTouchMove={e => e.stopPropagation()}
      onTouchEnd={e => e.stopPropagation()}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'stretch',
        height: WHEEL_ITEM_H * WHEEL_VISIBLE,
        background: 'white',
        borderRadius: 10,
        overflow: 'hidden',
        width: 'fit-content',
        margin: '0 auto',
      }}
    >
      <div style={{
        position: 'absolute',
        top: '50%',
        left: 0,
        right: 0,
        height: WHEEL_ITEM_H,
        transform: 'translateY(-50%)',
        background: 'rgba(0,0,0,0.06)',
        borderRadius: 8,
        pointerEvents: 'none',
      }} />

      <WheelColumnView ref={dayCol.ref} {...dayCol.bind} items={DAY_LIST} liveIndex={dayCol.liveIndex} width={56} />
      <WheelColumnView ref={ampm.ref} {...ampm.bind} items={AMPM_LIST} liveIndex={ampm.liveIndex} width={48} />
      <WheelColumnView ref={hour.ref} {...hour.bind} items={HOUR_LIST} liveIndex={hour.liveIndex} width={38} />

      <div style={labelStyle(6)}>시</div>

      {/* 분 00~55 (5분 단위) */}
      <WheelColumnView ref={min.ref} {...min.bind} items={MINUTE_LIST} liveIndex={min.liveIndex} width={38} />

      <div style={labelStyle(8)}>분</div>
    </div>
  );
}
