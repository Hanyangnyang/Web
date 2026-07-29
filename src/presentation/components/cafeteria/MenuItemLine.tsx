// 컴포넌트: 메뉴 한 줄. 컨테이너 폭보다 텍스트가 길면 자동으로 마퀴(가로 스크롤) 애니메이션을 건다.
import { useState, useLayoutEffect, useRef } from 'react';
import { parseBoldText } from './cafeteriaFormat.js';

interface MenuItemLineProps {
  html: string;
}

interface Marquee {
  duration: number;
}

export function MenuItemLine({ html }: MenuItemLineProps) {
  const scrollWrapRef = useRef<HTMLDivElement>(null);
  const spanRef = useRef<HTMLSpanElement>(null);
  const [marquee, setMarquee] = useState<Marquee | null>(null);

  useLayoutEffect(() => {
    const wrap = scrollWrapRef.current;
    const span = spanRef.current;
    if (!wrap || !span) return;
    const dist = span.scrollWidth - wrap.clientWidth;
    if (dist > 2) {
      setMarquee({ duration: Math.max(4, (span.scrollWidth + 16) / 30) });
    } else {
      setMarquee(null);
    }
  }, [html]);

  const parsedContent = parseBoldText(html);

  return (
    <div className="flex items-baseline whitespace-nowrap leading-[1.8]">
      <div ref={scrollWrapRef} className="overflow-hidden flex-1 min-w-0">
        <span
          ref={spanRef}
          className="inline-block"
          style={marquee ? { position: 'absolute', visibility: 'hidden', pointerEvents: 'none' } : undefined}
        >
          {parsedContent}
        </span>
        {marquee && (
          <span className="menu-item-marquee-track" style={{ animationDuration: `${marquee.duration}s` }}>
            <span className="inline-block menu-item-gap">{parsedContent}</span>
            <span className="inline-block menu-item-gap" aria-hidden="true">{parsedContent}</span>
          </span>
        )}
      </div>
    </div>
  );
}
