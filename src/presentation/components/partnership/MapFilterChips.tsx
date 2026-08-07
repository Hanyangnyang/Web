// 지도 상단 필터 칩: 매장 카테고리와 건물/흡연장 레이어를 같은 레벨의 단일 선택으로 묶는다.
// 이미 선택된 칩을 다시 탭하면 선택이 풀려(null) 지도에 아무 마커도 표시되지 않는 상태로 갈 수 있다.
import { CATEGORY_ORDER, CATEGORY_META, type CategoryFilter } from '../../../domain/entities/PartnerStore.js';

export type MapChip = 'building' | 'smoking' | CategoryFilter;

interface Props {
  value: MapChip | null;
  onChange: (next: MapChip | null) => void;
}

const CHIPS: { key: MapChip; label: string; emoji?: string }[] = [
  { key: 'building', label: '교내시설', emoji: '🏢' },
  { key: 'smoking', label: '흡연장', emoji: '🚬' },
  ...CATEGORY_ORDER.map((key) => ({ key, label: CATEGORY_META[key].label, emoji: CATEGORY_META[key].emoji })),
];

export function MapFilterChips({ value, onChange }: Props) {
  return (
    <div className="flex gap-1.5 overflow-x-auto no-scrollbar pointer-events-auto">
      {CHIPS.map((chip) => {
        const active = value === chip.key;
        return (
          <button
            key={chip.key}
            onClick={() => onChange(active ? null : chip.key)}
            aria-pressed={active}
            className={`flex items-center gap-1 px-3 py-[7px] rounded-full text-[12px] font-bold whitespace-nowrap border transition-all duration-200 active:scale-[0.96] shadow-[0_2px_6px_rgba(0,0,0,0.08)] [-webkit-tap-highlight-color:transparent] ${
              active
                ? 'bg-[#0E4A84] text-white border-[#0E4A84]'
                : 'bg-white text-[#334155] border-[#e2e8f0]'
            }`}
          >
            {chip.emoji && <span className="text-[13px]">{chip.emoji}</span>}
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}
