import type { ReactNode, CSSProperties } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';

interface AccordionProps {
  isExpanded: boolean;
  onToggle: () => void;
  header: ReactNode; // 헤더 좌측 내용 (아이콘·제목 등 도메인마다 다름)
  extra?: ReactNode; // 헤더 우측, 화살표 왼쪽에 들어갈 내용 (배지 등)
  chevronDirection?: 'right' | 'down'; // 'right': 90도 회전(기본), 'down': 180도 회전
  children: ReactNode; // 펼쳤을 때 보이는 본문
  className?: string;
  style?: CSSProperties;
  dataType?: string; // 딥링크 스크롤 앵커 등에 쓰는 data-type 속성
}

// 토글형 아코디언 껍데기 — 헤더 클릭 시 화살표 회전 + grid-template-rows 트랜지션으로 본문을 펼치고 접음
export function Accordion({
  isExpanded,
  onToggle,
  header,
  extra,
  chevronDirection = 'right',
  children,
  className = '',
  style,
  dataType,
}: AccordionProps) {
  return (
    <div
      className={`bg-white border border-[#e2e8f0] rounded-card overflow-hidden shadow-[0_2px_4px_rgba(0,0,0,0.02)] mb-3 ${className}`}
      style={style}
      data-type={dataType}
    >
      <div
        className="flex justify-between items-center px-4 py-2.5 cursor-pointer transition-colors duration-150 hover:bg-slate-50 select-none"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2 min-w-0">{header}</div>
        <div className="flex items-center gap-2">
          {extra}
          {chevronDirection === 'right' ? (
            <ChevronRight
              size={16}
              color="#94a3b8"
              style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}
            />
          ) : (
            <ChevronDown
              size={16}
              className={`text-[#94a3b8] transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            />
          )}
        </div>
      </div>
      <div className={`accordion-content ${isExpanded ? 'expanded' : ''}`}>
        <div className="accordion-inner border-t border-[#f1f5f9]">
          {children}
        </div>
      </div>
    </div>
  );
}
