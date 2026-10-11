import { CollegeWheelPicker } from '../../ui/CollegeWheelPicker';
import { GENRES } from '../playlistTypes';
import { CHIP_INACTIVE, type GenreFilterState } from './GenreFilterChips';

interface GenreFilterDropdownProps {
  value: GenreFilterState;
  onChange: (next: GenreFilterState) => void;
  className?: string;
}

// 선택이 없는 상태(전체)는 "전체" 대신 "장르"로 표시
const OPTIONS = GENRES.map((genre) => ({ id: genre.key, label: genre.key === 'all' ? '장르' : genre.label }));

// 장르 필터 드롭다운 — 캠퍼스맵 제휴 목록의 단과대 선택(CollegeWheelPicker)과 같은 스크롤-스냅 휠피커 UI.
// 기간 칩(실시간/주간/월간) 같은 줄 오른쪽에 두는 용도. 하나만 고를 수 있고, 휠이 250ms 멈추면 목록을 연 채로 바로 반영된다(닫을 때도 반영)
export function GenreFilterDropdown({ value, onChange, className = '' }: GenreFilterDropdownProps) {
  const selectedKey = value.selected[0] ?? 'all';

  return (
    <div className={className}>
      <CollegeWheelPicker
        options={OPTIONS}
        value={selectedKey}
        panelWidthClassName="w-[96px]"
        liveChangeDelayMs={250}
        onChange={(key) => onChange({ ...value, selected: key === 'all' ? [] : [key] })}
        // 왼쪽 기간 칩(ChartPeriodChips)과 같은 칩 모양 — 장르를 골라도 파랑으로 바뀌지 않고 흰 칩 그대로(선택 여부는 칩 글자가 "장르" → 장르명으로 바뀌어 드러남)
        triggerClassName={`min-w-[64px] max-w-[96px] flex items-center justify-between gap-1 text-sm font-medium border rounded-lg pl-3 pr-2 py-1.5 transition-colors duration-200 ${CHIP_INACTIVE}`}
      />
    </div>
  );
}
