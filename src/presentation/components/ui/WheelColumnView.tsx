import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { WHEEL_ITEM_H } from '../../hooks/useWheelColumn.js';

export const WHEEL_VISIBLE = 3;

export interface WheelColumnViewProps
  extends Pick<HTMLAttributes<HTMLDivElement>, 'onScroll' | 'onWheel' | 'onMouseDown' | 'onMouseLeave' | 'onMouseUp' | 'onMouseMove'> {
  items: (string | number)[];
  liveIndex: number;
  width: number;
  enableDrag?: boolean;
}

export const WheelColumnView = forwardRef<HTMLDivElement, WheelColumnViewProps>(function WheelColumnView(
  { items, liveIndex, width, enableDrag = true, ...bind },
  ref
) {
  return (
    <div
      ref={ref}
      {...bind}
      className="alarm-picker-scroll"
      style={{
        height: WHEEL_ITEM_H * WHEEL_VISIBLE,
        overflowY: 'auto',
        scrollSnapType: 'y mandatory',
        width,
        touchAction: 'pan-y',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        cursor: enableDrag ? 'grab' : 'default',
      }}
    >
      <div style={{ height: WHEEL_ITEM_H }} />
      {items.map((opt, idx) => (
        <div
          key={opt}
          style={{
            height: WHEEL_ITEM_H,
            scrollSnapAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            fontWeight: idx === liveIndex ? 700 : 400,
            color: idx === liveIndex ? '#1e293b' : '#d1d5db',
            userSelect: 'none',
          }}
        >
          {opt}
        </div>
      ))}
      <div style={{ height: WHEEL_ITEM_H }} />
    </div>
  );
});
