// 지도 상단 필터 칩: 매장 카테고리와 교내시설/오픈스페이스/흡연장 레이어를 같은 레벨의 단일 선택으로 묶는다.
import { useEffect, useRef } from 'react';
import { CATEGORY_META, type StoreCategory } from '../../../domain/entities/PartnerStore.js';
import type { MapChip } from '../../hooks/campusMap/useCampusMapFilters.js';

interface Props {
  value: MapChip | null;
  onChange: (next: MapChip | null) => void;
}

const categoryChip = (key: StoreCategory) => ({ key, label: CATEGORY_META[key].label, emoji: CATEGORY_META[key].emoji });

// 매장 카테고리와 시설 레이어가 섞인 순서라 CATEGORY_ORDER를 펼치지 않고 하나씩 나열한다
// (CATEGORY_ORDER는 매장 목록 그룹핑 순서에도 쓰이므로 여기 맞춰 바꾸지 않는다)
const CHIPS: { key: MapChip; label: string; emoji?: string }[] = [
  { key: 'all', label: '전체' },
  categoryChip('food'),
  categoryChip('cafe'),
  { key: 'openspace', label: '오픈스페이스', emoji: '📚' },
  { key: 'smoking', label: '흡연장', emoji: '🚬' },
  { key: 'building', label: '교내시설', emoji: '🏢' },
  { key: 'parking', label: '주차장', emoji: '🅿️' },
  categoryChip('pub'),
  categoryChip('play'),
  categoryChip('life'),
];

export function MapFilterChips({ value, onChange }: Props) {
  const stripRef = useRef<HTMLDivElement>(null);
  const chipRefs = useRef<Partial<Record<MapChip, HTMLButtonElement | null>>>({});

  useEffect(() => {
    const strip = stripRef.current;
    const chip = value ? chipRefs.current[value] : null;
    if (!strip || !chip) return;
    const stripRect = strip.getBoundingClientRect();
    const chipRect = chip.getBoundingClientRect();
    const delta = (chipRect.left - stripRect.left) - (stripRect.width - chipRect.width) / 2;
    strip.scrollBy({ left: delta, behavior: 'smooth' });
  }, [value]);

  return (
    <div ref={stripRef} className="flex gap-1.5 overflow-x-auto no-scrollbar pointer-events-auto">
      {CHIPS.map((chip) => {
        const active = value === chip.key;
        return (
          <button
            key={chip.key}
            ref={(el) => { chipRefs.current[chip.key] = el; }}
            onClick={() => onChange(active ? null : chip.key)}
            aria-pressed={active}
            className={`flex items-center gap-1 px-2 py-[7px] rounded-full text-[12px] font-bold whitespace-nowrap border transition-all duration-200 active:scale-[0.96] shadow-[0_2px_6px_rgba(0,0,0,0.08)] [-webkit-tap-highlight-color:transparent] ${
              active
                ? 'bg-[#0E4A84] text-white border-[#0E4A84]'
                : 'bg-white text-[#334155] border-[#e2e8f0]'
            }`}
          >
            {chip.emoji && <span className="text-[12px]">{chip.emoji}</span>}
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}
