import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent, WheelEvent as ReactWheelEvent } from 'react';

export const WHEEL_ITEM_H = 36;

const COMMIT_DEBOUNCE_MS = 150;
const WHEEL_COOLDOWN_MS = 500;

export interface UseWheelColumnOptions {
  length: number;
  activeIndex: number;
  onSettle: () => void;
  // 스크롤/휠이 첫/마지막 인덱스를 넘어가려 할 때 호출. true를 반환하면 반대쪽 끝으로 넘어감
  // (시 컬럼이 11시를 넘어갈 때 오전/오후 컬럼을 같이 넘기는 캐리오버 같은 경우에 씀)
  onOverflow?: (direction: 1 | -1) => boolean;
  enableWheel?: boolean;
  enableDrag?: boolean;
}

export function useWheelColumn({
  length,
  activeIndex,
  onSettle,
  onOverflow,
  enableWheel = true,
  enableDrag = true,
}: UseWheelColumnOptions) {
  const ref = useRef<HTMLDivElement>(null);
  const [liveIndex, setLiveIndex] = useState(activeIndex);
  const commitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wheelCooldown = useRef(false);
  const lastIndex = length - 1;

  useLayoutEffect(() => {
    if (ref.current) ref.current.scrollTop = activeIndex * WHEEL_ITEM_H;
    // 마운트 시 1회만 초기 스크롤 위치 세팅
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setLiveIndex(activeIndex);
  }, [activeIndex]);

  const clamp = (i: number) => Math.max(0, Math.min(i, lastIndex));

  // 커밋 시점에 React state가 아니라 실제 DOM scrollTop을 직접 읽어서
  // 동시에 여러 컬럼이 움직일 때 상태 업데이트 지연으로 생기는 stale 값을 피함
  const getIndex = () => {
    if (!ref.current) return liveIndex;
    return clamp(Math.round(ref.current.scrollTop / WHEEL_ITEM_H));
  };

  const setIndex = (index: number) => {
    if (ref.current) ref.current.scrollTop = index * WHEEL_ITEM_H;
    setLiveIndex(index);
  };

  const scheduleCommit = () => {
    if (commitTimer.current) clearTimeout(commitTimer.current);
    commitTimer.current = setTimeout(onSettle, COMMIT_DEBOUNCE_MS);
  };

  const handleScroll = () => {
    const el = ref.current;
    if (!el) return;
    const curScroll = el.scrollTop;
    const maxScroll = lastIndex * WHEEL_ITEM_H;

    // 오버스크롤(튕김) 감지 시 onOverflow에 위임
    if (onOverflow && curScroll > maxScroll + 10 && onOverflow(1)) {
      setIndex(0);
      scheduleCommit();
      return;
    }
    if (onOverflow && curScroll < -10 && onOverflow(-1)) {
      setIndex(lastIndex);
      scheduleCommit();
      return;
    }

    setLiveIndex(clamp(Math.round(curScroll / WHEEL_ITEM_H)));
    scheduleCommit();
  };

  const handleWheel = (e: ReactWheelEvent) => {
    if (!enableWheel) return;
    e.preventDefault();
    if (Math.abs(e.deltaY) < 10) return;
    if (wheelCooldown.current) return;
    wheelCooldown.current = true;
    setTimeout(() => { wheelCooldown.current = false; }, WHEEL_COOLDOWN_MS);

    const el = ref.current;
    if (!el) return;
    const cur = Math.round(el.scrollTop / WHEEL_ITEM_H);
    const dir: 1 | -1 = e.deltaY > 0 ? 1 : -1;
    let next = cur + dir;

    if (next > lastIndex) {
      if (!onOverflow?.(1)) return;
      next = 0;
    } else if (next < 0) {
      if (!onOverflow?.(-1)) return;
      next = lastIndex;
    }
    setIndex(next);
    onSettle();
  };

  const drag = useRef({ isDown: false, startY: 0, scrollTop: 0 });

  const handleMouseDown = (e: ReactMouseEvent) => {
    if (!enableDrag || !ref.current) return;
    drag.current.isDown = true;
    ref.current.style.cursor = 'grabbing';
    drag.current.startY = e.pageY - ref.current.offsetTop;
    drag.current.scrollTop = ref.current.scrollTop;
  };

  const endDrag = () => {
    if (!enableDrag || !ref.current) return;
    drag.current.isDown = false;
    ref.current.style.cursor = 'grab';
  };

  const handleMouseMove = (e: ReactMouseEvent) => {
    if (!enableDrag || !drag.current.isDown || !ref.current) return;
    e.preventDefault();
    const y = e.pageY - ref.current.offsetTop;
    const walk = (y - drag.current.startY) * 1.2;
    ref.current.scrollTop = drag.current.scrollTop - walk;
  };

  return {
    ref,
    liveIndex,
    getIndex,
    setIndex,
    bind: {
      onScroll: handleScroll,
      onWheel: handleWheel,
      onMouseDown: handleMouseDown,
      onMouseLeave: endDrag,
      onMouseUp: endDrag,
      onMouseMove: handleMouseMove,
    },
  };
}
