import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';

// 한 줄에 다 안 들어가는 글자를 자르지 않고, 한 방향(오른쪽→왼쪽)으로 계속 흘려보내는 전광판식 텍스트.
// 글자가 끝나면 사이에 간격을 두고 같은 글자가 이어서 따라와서 "제목   제목   제목" 처럼 끊김 없이 반복됨.
// 폭에 다 들어가면 움직이지 않음. 모션 줄이기 설정(prefers-reduced-motion)이면 애니메이션 없이 잘린 채로 둠

const LOOP_GAP_PX = 32; // 한 바퀴 돌고 다음 글자가 이어지기 전의 간격(pl-8과 같은 값이어야 함)
const PX_PER_SECOND = 30; // 흐르는 속도 — 읽을 수 있는 정도로 느리게
const PAUSE_RATIO = 0.2; // 한 바퀴 시간 중 맨 앞에서 가만히 있는 비율(index.css marqueeSlide의 20%와 같은 값이어야 함) — 처음 글자를 읽을 시간

interface MarqueeTextProps {
  text: string;
  className?: string;
}

export function MarqueeText({ text, className = '' }: MarqueeTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  // 글자 한 개의 폭과 보이는 폭 — 글자가 더 길 때만 흐르게 함
  const [textWidth, setTextWidth] = useState(0);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const textEl = textRef.current;
    if (!container || !textEl) return;

    const measure = () => {
      setTextWidth(textEl.offsetWidth);
      setIsOverflowing(textEl.offsetWidth > container.clientWidth);
    };
    measure();
    // 화면 회전·폰트 로딩 등으로 폭이 바뀌면 다시 잼
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, [text]);

  // 한 칸(글자 + 간격)만큼 왼쪽으로 가면 다음 복사본이 정확히 처음 자리에 와서 이음새가 안 보임
  const distancePx = textWidth + LOOP_GAP_PX;
  const durationS = distancePx / PX_PER_SECOND / (1 - PAUSE_RATIO);

  return (
    <div ref={containerRef} className={`overflow-hidden whitespace-nowrap ${className}`}>
      <div
        className={`inline-flex ${isOverflowing ? 'marquee-slide motion-reduce:[animation:none]' : ''}`}
        style={isOverflowing ? ({ '--marquee-distance': `-${distancePx}px`, animationDuration: `${durationS}s` } as CSSProperties) : undefined}
      >
        <span ref={textRef}>{text}</span>
        {isOverflowing && (
          <span aria-hidden="true" className="pl-8">
            {text}
          </span>
        )}
      </div>
    </div>
  );
}
