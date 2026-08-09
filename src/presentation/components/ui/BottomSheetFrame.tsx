// 지도 위에 올라오는 바텀시트의 공용 껍데기 (매장·교내시설·흡연장 시트가 함께 쓴다).
//
// height/maxHeight는 Tailwind 클래스가 아니라 CSS 길이 문자열을 받는다 —
// 시트 종류마다 높이가 달라 동적으로 만들어야 하는데, 동적 문자열은 Tailwind 스캐너가 못 잡기 때문.
// height에 'auto'를 주면 내용 높이에 맞춰지고, maxHeight까지만 커진 뒤 내부가 스크롤된다.
import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { useReportSheetHeight } from './sheetHeight.js';

interface Props {
  height: string;
  maxHeight?: string;
  children: ReactNode;
}

export function BottomSheetFrame({ height, maxHeight, children }: Props) {
  const frameRef = useRef<HTMLDivElement>(null);
  const reportHeight = useReportSheetHeight();

  // 렌더된 실제 높이를 화면에 보고한다 (어디에 반영할지는 보고받는 쪽의 몫 — sheetHeight.ts 참고)
  useLayoutEffect(() => {
    const el = frameRef.current;
    if (!el || !reportHeight) return;
    const sync = () => reportHeight(el.offsetHeight);
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(el);
    return () => {
      observer.disconnect();
      reportHeight(null); // 시트가 사라짐
    };
  }, [reportHeight]);

  return (
    <div
      ref={frameRef}
      style={{ height, maxHeight }}
      className="absolute bottom-0 inset-x-0 z-20 bg-white rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.15)] flex flex-col transition-[height] duration-300 ease-out"
    >
      {children}
    </div>
  );
}
