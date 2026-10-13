import { CHIP_BASE, CHIP_INACTIVE, CHIP_LARGE } from './GenreFilterChips';

// 켜졌을 때 — 회색·흰색·검정 계열만: 장르 칩 선택 상태(색 채움 + 흰 글자)와 같은 모양을 회색으로.
// 장르 칩(파란 채움)과 성격이 다른 필터라는 건 색 대신 구분선과 고정 위치로 구분됨
const CHIP_MINE_ACTIVE = 'bg-slate-400 text-white border-transparent';

interface MineOnlyChipProps {
  active: boolean;
  onToggle: (active: boolean) => void;
  large?: boolean; // 장르 칩과 크기를 맞춤 — 목록 화면은 large, 홈 미리보기는 기본 크기
}

// "내 추천" 토글 칩 — 홈 최근 추천된 곡 미리보기와 최근 추가된 곡 화면의 장르 칩 줄 오른쪽 끝(GenreFilterChips의 pinned)에 고정
export function MineOnlyChip({ active, onToggle, large = false }: MineOnlyChipProps) {
  return (
    <button
      type="button"
      onClick={() => onToggle(!active)}
      aria-pressed={active}
      className={`${CHIP_BASE} ${large ? CHIP_LARGE : ''} ${active ? CHIP_MINE_ACTIVE : CHIP_INACTIVE}`}
    >
      <span>내 추천</span>
    </button>
  );
}
