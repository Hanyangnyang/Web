// 건물 이름 자동완성 입력칸 — '1'만 쳐도 '제1공학관' 같은 교내시설 후보를 입력칸 아래 드롭다운으로 띄운다.
// 매칭은 캠퍼스맵 검색(SearchOverlay)과 같은 searchBuildings(건물 번호·이름·별칭 부분 일치)를 쓰고,
// 건물 데이터도 같은 useCampusBuildings 캐시를 공유해 추가 요청이 없다.
// 목록에 없는 건물도 있을 수 있어 자유 입력은 그대로 허용한다 — 후보를 고르면 buildingId까지 채워지고,
// 고른 뒤 다시 타이핑하면 그 건물과 더는 같지 않으므로 buildingId를 비운다
import { useMemo, useState } from 'react';
import { searchBuildings, type PlottableBuilding } from '../../../domain/entities/CampusBuilding.js';
import { normalizeForSearch } from '../../../lib/searchText.js';
import { useCampusBuildings } from '../../hooks/campusMap/useCampusBuildings.js';

const MAX_SUGGESTIONS = 6;

// '1'처럼 짧은 검색어는 부분 일치로 후보가 많이 걸리므로, 더 그럴듯한 것부터 위로 올린다
//  0: 건물 번호가 정확히 같음  1: 이름·별칭이 검색어로 시작  2: 그 외 부분 일치
function rank(b: PlottableBuilding, q: string): number {
  if (normalizeForSearch(b.buildingNumber) === q) return 0;
  if ([b.name, ...b.aliases].some((t) => normalizeForSearch(t).startsWith(q))) return 1;
  return 2;
}

interface Props {
  value: string;
  onChange: (text: string, buildingId: string | null) => void;
  placeholder?: string;
  className?: string;
  // 드롭다운의 가로 위치·폭 — 기본은 입력칸과 같은 폭. 입력칸이 좁은 자리(한 줄에 두 칸)에선 쓰는 쪽이 넓혀준다
  listClassName?: string;
}

export function BuildingAutocompleteInput({ value, onChange, placeholder, className, listClassName = 'left-0 right-0' }: Props) {
  const { buildings } = useCampusBuildings({ enabled: true });
  const [focused, setFocused] = useState(false);
  // 방금 후보를 골라 입력값이 그 건물 이름과 같아진 상태 — 이때는 드롭다운을 다시 띄우지 않는다
  const [pickedName, setPickedName] = useState<string | null>(null);

  const suggestions = useMemo(() => {
    const q = normalizeForSearch(value.trim());
    if (!q) return [];
    return searchBuildings(buildings, value)
      .map((b, i) => ({ b, r: rank(b, q), i }))
      .sort((x, y) => x.r - y.r || x.i - y.i) // 같은 순위면 원래 데이터 순서 유지
      .slice(0, MAX_SUGGESTIONS)
      .map(({ b }) => b);
  }, [buildings, value]);

  // 데이터 로딩 중·실패 시엔 후보가 비어 드롭다운이 안 뜰 뿐, 자유 입력은 계속 된다
  const open = focused && suggestions.length > 0 && value !== pickedName;

  const pick = (b: PlottableBuilding) => {
    setPickedName(b.name);
    onChange(b.name, b.id);
  };

  return (
    <div className="relative">
      <input
        value={value}
        onChange={(e) => {
          setPickedName(null);
          onChange(e.target.value, null);
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        maxLength={30}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        className={className}
      />
      {open && (
        <ul
          role="listbox"
          className={`absolute ${listClassName} top-full mt-1 z-10 max-h-[200px] overflow-y-auto bg-white border border-[#e2e8f0] rounded-xl shadow-[0_6px_16px_rgba(15,23,42,0.12)] py-1`}
        >
          {suggestions.map((b) => (
            <li key={b.id} role="option" aria-selected={false}>
              <button
                type="button"
                // mousedown 기본동작(포커스 이동)을 막아야 input blur로 목록이 먼저 닫혀 클릭이 씹히지 않는다
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(b)}
                className="w-full flex items-baseline gap-1.5 px-3 py-2 text-left active:bg-slate-50 [-webkit-tap-highlight-color:transparent]"
              >
                <span className="text-[13px] font-bold text-text-main truncate">{b.name}</span>
                {b.buildingNumber && (
                  <span className="flex-shrink-0 text-[10px] font-bold text-text-hint">{b.buildingNumber}동</span>
                )}
                {b.aliases.length > 0 && (
                  <span className="min-w-0 text-[10px] font-medium text-text-hint truncate">{b.aliases.join(' · ')}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
