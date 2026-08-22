// 컴포넌트: 지하철 노선 뱃지 (4호선/수인분당선)
import type { SubwayOpt } from '../../../domain/entities/Subway.js';

interface LineBadgeProps {
  opt: SubwayOpt;
  size?: number;
}

export function LineBadge({ opt, size = 32 }: LineBadgeProps) {
  const is4 = opt.line === '4호선';
  return (
    <div className="rounded-full flex items-center justify-center flex-shrink-0" style={{ width: size, height: size, background: opt.color }}>
      {is4
        ? <span className="font-['Inter',-apple-system,sans-serif] font-black text-white" style={{ fontSize: size * 0.5 }}>4</span>
        : <span className="font-black text-white text-center leading-[1.1]" style={{ fontSize: size * 0.22 }}>수인<br />분당</span>
      }
    </div>
  );
}
