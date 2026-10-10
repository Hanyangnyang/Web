import { useLayoutEffect, useRef } from 'react';
import { GENRES } from '../playlistTypes';

// 장르 필터의 상태 — 선택(비어 있으면 전체, 하나만 선택 가능해서 길이 0 또는 1)과 칩 순서(최근에 고른 순서)를 함께 들고 있다.
// 홈 미리보기와 최근 추가된 곡 화면이 같은 값을 공유해서 선택도 칩 위치도 똑같이 보이게 한다
export interface GenreFilterState {
  selected: string[];
  recent: string[];
}

export const EMPTY_GENRE_FILTER: GenreFilterState = { selected: [], recent: [] };

interface GenreFilterChipsProps {
  value: GenreFilterState;
  onChange: (next: GenreFilterState) => void;
  className?: string;
  large?: boolean; // 목록 화면처럼 모바일에서 누르기 편하도록 칩을 조금 키움(홈 미리보기는 기본 크기)
}

// 선택 안 된 칩은 모두 기본 흰색, 선택된 칩은 플레이리스트 파란색 계열의 연한 톤
// 인기차트 기간 칩(ChartPeriodChips)도 같은 모양을 쓰도록 export
export const CHIP_INACTIVE = 'bg-white text-gray-700 border-slate-200';
export const CHIP_ACTIVE = 'bg-[#8FB0F3] text-white border-transparent';
export const CHIP_LARGE = 'px-[10.5px] py-[4.5px] text-[13.5px]';
export const CHIP_BASE = 'flex items-center gap-1 px-[9px] py-[3px] rounded-2xl text-[13px] font-bold whitespace-nowrap border flex-shrink-0 transition-colors duration-200 active:scale-[0.96]';

const MOVE_MS = 300;
const GENRE_KEYS = GENRES.map((genre) => genre.key);

export function GenreFilterChips({ value, onChange, className = '', large = false }: GenreFilterChipsProps) {
  const { selected: selectedGenres, recent: recentKeys } = value;
  const containerRef = useRef<HTMLDivElement>(null);
  const chipRefs = useRef(new Map<string, HTMLButtonElement>());
  const prevLeftRef = useRef(new Map<string, number>());

  // 하나만 선택 가능 — 다른 칩을 누르면 교체, 선택된 칩을 다시 누르면 해제(전체)
  const toggleGenre = (key: string) => {
    if (selectedGenres.includes(key)) {
      onChange({ ...value, selected: [] });
      return;
    }
    // 선택을 풀어도 recent에 남아서, 자주 쓰는 칩이 "전체" 바로 옆에 모인다(가장 최근이 앞)
    onChange({ selected: [key], recent: [key, ...recentKeys.filter((k) => k !== key)] });
  };

  // 전체 → 최근 선택한 칩(최근 순) → 나머지 칩(원래 순서)
  const order = ['all', ...recentKeys, ...GENRE_KEYS.filter((key) => key !== 'all' && !recentKeys.includes(key))];
  const orderSignature = order.join(',');

  // FLIP 애니메이션: 순서가 바뀐 직후(페인트 전) 칩이 이전 위치에서 새 위치로 미끄러지게 한다.
  // 위치는 스크롤과 무관한 offsetLeft로 재서, 스크롤된 상태에서도 오차가 없다
  useLayoutEffect(() => {
    const nextLeft = new Map<string, number>();
    chipRefs.current.forEach((element, key) => nextLeft.set(key, element.offsetLeft));

    chipRefs.current.forEach((element, key) => {
      const prev = prevLeftRef.current.get(key);
      const next = nextLeft.get(key);
      if (prev === undefined || next === undefined || prev === next) return;
      element.style.transition = 'none';
      element.style.transform = `translateX(${prev - next}px)`;
      void element.offsetWidth; // 강제 리플로우로 시작 위치를 확정한 뒤 transition을 켠다
      element.style.transition = `transform ${MOVE_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`;
      element.style.transform = '';
    });

    prevLeftRef.current = nextLeft;
    // 선택한 칩이 보이도록 왼쪽 끝으로 스크롤 — 가로 스크롤된 상태에서도 방금 고른 칩이 전체 옆에 보이게
    containerRef.current?.scrollTo({ left: 0, behavior: 'smooth' });
  }, [orderSignature]);

  return (
    <div
      ref={containerRef}
      className={`relative flex gap-1.5 overflow-x-auto px-4 ml-[-1rem] [&::-webkit-scrollbar]:hidden ${className}`}
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      {order.map((key) => {
        const genre = GENRES.find((item) => item.key === key)!;
        const isAll = key === 'all';
        // 전체는 선택된 장르가 하나도 없을 때 켜지고, 누르면 선택을 모두 해제
        const isSelected = isAll ? selectedGenres.length === 0 : selectedGenres.includes(key);
        return (
          <button
            key={key}
            ref={(element) => {
              if (element) chipRefs.current.set(key, element);
              else chipRefs.current.delete(key);
            }}
            onClick={() => (isAll ? onChange({ ...value, selected: [] }) : toggleGenre(key))}
            aria-pressed={isSelected}
            className={`${CHIP_BASE} ${large ? CHIP_LARGE : ''} ${
              isSelected ? CHIP_ACTIVE : CHIP_INACTIVE
            }`}
          >
            <span>{genre.label}</span>
          </button>
        );
      })}
    </div>
  );
}
