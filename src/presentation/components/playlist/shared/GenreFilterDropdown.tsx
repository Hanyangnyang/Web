import { CollegeWheelPicker } from '../../ui/CollegeWheelPicker';
import { GENRES } from '../playlistTypes';
import { type GenreFilterState } from './GenreFilterChips';

interface GenreFilterDropdownProps {
  value: GenreFilterState;
  onChange: (next: GenreFilterState) => void;
  className?: string;
}

// 선택이 없는 상태(전체)는 "전체" 대신 "장르"로 표시
const OPTIONS = GENRES.map((genre) => ({ id: genre.key, label: genre.key === 'all' ? '장르' : genre.label }));

// 장르 필터 드롭다운 — 캠퍼스맵 제휴 목록의 단과대 선택(CollegeWheelPicker)과 같은 스크롤-스냅 휠피커 UI.
// 기간 칩(실시간/주간/월간) 같은 줄 오른쪽에 두는 용도. 하나만 고를 수 있고, 목록이 닫힐 때 선택이 반영된다
export function GenreFilterDropdown({ value, onChange, className = '' }: GenreFilterDropdownProps) {
  const selectedKey = value.selected[0] ?? 'all';

  return (
    <div className={className}>
      <CollegeWheelPicker
        options={OPTIONS}
        value={selectedKey}
        panelWidthClassName="w-[96px]"
        onChange={(key) => onChange({ ...value, selected: key === 'all' ? [] : [key] })}
        triggerClassName="min-w-[64px] max-w-[96px] flex items-center justify-between gap-1 text-[13px] font-bold text-text-main bg-surface border border-[#e2e8f0] rounded-lg pl-2 pr-1.5 py-1.5"
      />
    </div>
  );
}
