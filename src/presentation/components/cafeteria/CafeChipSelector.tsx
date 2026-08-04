// 컴포넌트: 학식 탭 식당 선택 칩 목록 ("전체" + 식당별)
import { useEffect, useRef } from 'react';
import { createCafe, KNOWN_CAFES, type Cafe } from '../../../domain/entities/Cafe.js';

const PLACEHOLDER_CAFES: Cafe[] = KNOWN_CAFES.map(({ id, name }) => createCafe({ id, name, available: true }));

interface CafeChipSelectorProps {
  cafes: Cafe[];
  selectedCafeId: string;
  loading: boolean;
  onSelect: (id: string) => void;
}

export function CafeChipSelector({ cafes, selectedCafeId, loading, onSelect }: CafeChipSelectorProps) {
  const chipScrollRef = useRef<HTMLDivElement>(null);
  const displayCafes = loading && cafes.length === 0 ? PLACEHOLDER_CAFES : cafes;

  // 선택된 칩이 잘릴 경우 자동 스크롤
  useEffect(() => {
    const container = chipScrollRef.current;
    if (!container || selectedCafeId === 'all') return;
    const chip = container.querySelector<HTMLElement>(`[data-cafe-id="${selectedCafeId}"]`);
    if (!chip) return;
    const containerLeft = container.scrollLeft;
    const containerRight = containerLeft + container.clientWidth;
    const chipLeft = chip.offsetLeft;
    const chipRight = chipLeft + chip.offsetWidth;
    if (chipRight > containerRight) {
      container.scrollTo({ left: chipRight - container.clientWidth + 16, behavior: 'smooth' });
    } else if (chipLeft < containerLeft) {
      container.scrollTo({ left: chipLeft - 16, behavior: 'smooth' });
    }
  }, [selectedCafeId]);

  return (
    <div
      ref={chipScrollRef}
      className="flex gap-1.5 pt-3 overflow-x-auto no-scrollbar scroll-smooth"
      style={{ opacity: loading ? 0.6 : 1, pointerEvents: loading ? 'none' : 'auto' }}
    >
      {/* 전체 조회 탭 */}
      <div
        className={`flex-shrink-0 py-2 border rounded-card text-[clamp(0.65rem,3.1vw,0.82rem)] font-semibold cursor-pointer transition-all duration-200 relative flex items-center justify-center gap-[0.3rem] whitespace-nowrap overflow-visible [-webkit-tap-highlight-color:transparent] ${
          selectedCafeId === 'all'
            ? 'bg-primary text-white border-primary shadow-sm'
            : 'bg-white border-[#e2e8f0] text-text-sub hover:border-primary hover:text-primary'
        }`}
        style={{ paddingLeft: '18px', paddingRight: '18px' }}
        onClick={() => onSelect('all')}
      >
        전체
      </div>

      {displayCafes.map(cafe => (
        <div
          key={cafe.id}
          data-cafe-id={cafe.id}
          className={`flex-shrink-0 py-2 border rounded-card text-[clamp(0.65rem,3.1vw,0.82rem)] font-semibold cursor-pointer transition-all duration-200 relative flex items-center justify-center gap-[0.3rem] whitespace-nowrap overflow-visible [-webkit-tap-highlight-color:transparent] ${
            selectedCafeId === cafe.id
              ? 'bg-primary text-white border-primary shadow-sm'
              : !cafe.available
                ? 'bg-white border-[#e2e8f0] text-text-sub opacity-30'
                : 'bg-white border-[#e2e8f0] text-text-sub hover:border-primary hover:text-primary'
          }`}
          style={{ paddingLeft: '13px', paddingRight: '13px' }}
          onClick={() => onSelect(cafe.id)}
        >
          {cafe.name}
          {cafe.hasJeyuk && (
            <span className="absolute top-[-11px] right-[-8px] bg-error text-white text-[0.65rem] px-1.5 py-0.5 rounded font-extrabold shadow-[0_2px_8px_rgba(239,68,68,0.4)]">
              🔥 제육
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
