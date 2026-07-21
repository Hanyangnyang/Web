// 지도 상단 카테고리 필터 칩 (단일 선택)
import { CATEGORY_ORDER, CATEGORY_META, type CategoryFilter } from './storeData';

interface Props {
  value: CategoryFilter;
  onChange: (category: CategoryFilter) => void;
}

const CHIPS: { key: CategoryFilter; label: string; emoji?: string }[] = [
  { key: 'all', label: '전체' },
  ...CATEGORY_ORDER.map((key) => ({ key, label: CATEGORY_META[key].label, emoji: CATEGORY_META[key].emoji })),
];

export function CategoryChips({ value, onChange }: Props) {
  return (
    <div className="flex gap-1.5 overflow-x-auto no-scrollbar pointer-events-auto">
      {CHIPS.map((chip) => (
        <button
          key={chip.key}
          onClick={() => onChange(chip.key)}
          className={`flex items-center gap-1 px-3 py-[7px] rounded-full text-[12px] font-bold whitespace-nowrap border transition-all duration-200 active:scale-[0.96] shadow-[0_2px_6px_rgba(0,0,0,0.08)] [-webkit-tap-highlight-color:transparent] ${
            value === chip.key
              ? 'bg-[#0E4A84] text-white border-[#0E4A84]'
              : 'bg-white text-[#334155] border-[#e2e8f0]'
          }`}
        >
          {chip.emoji && <span className="text-[13px]">{chip.emoji}</span>}
          {chip.label}
        </button>
      ))}
    </div>
  );
}
