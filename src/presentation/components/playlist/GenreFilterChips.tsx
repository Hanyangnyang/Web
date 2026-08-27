import { GENRES } from './playlistTypes';

interface GenreFilterChipsProps {
  selectedGenre: string;
  onSelectGenre: (key: string) => void;
  // '전체' 칩의 색상만 화면마다 다르게 써서(홈: 진남색/화이트, 리스트화면: slate) variant로 분기
  variant?: 'main' | 'list';
  className?: string;
}

const ALL_CHIP_STYLES = {
  main: {
    active: 'bg-[#2B3B52] text-white border-transparent shadow-[0_4px_10px_rgba(43,59,82,0.35)]',
    inactive: 'bg-white text-[#2B3B52] border-[#2B3B52]',
  },
  list: {
    active: 'bg-slate-700 text-white border-transparent shadow-[0_2px_6px_rgba(51,65,85,0.25)]',
    inactive: 'bg-slate-200 text-slate-800 border-slate-400',
  },
};

export function GenreFilterChips({ selectedGenre, onSelectGenre, variant = 'main', className = '' }: GenreFilterChipsProps) {
  const allChipStyles = ALL_CHIP_STYLES[variant];

  return (
    <div
      className={`flex gap-2 overflow-x-auto px-4 ml-[-1rem] [&::-webkit-scrollbar]:hidden ${className}`}
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      {GENRES.map((genre) => (
        <button
          key={genre.key}
          onClick={() => onSelectGenre(genre.key)}
          className={`flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap border transition-all duration-200 active:scale-[0.96] ${
            selectedGenre === genre.key && genre.key !== 'all'
              ? `${genre.active} text-white border-transparent shadow-[0_2px_6px_rgba(14,74,132,0.25)]`
              : genre.key === 'all'
                ? (selectedGenre === 'all' ? allChipStyles.active : allChipStyles.inactive)
                : `${genre.light} text-gray-800 border-transparent`
          }`}
        >
          {genre.emoji && <span className="text-base">{genre.emoji}</span>}
          <span>{genre.label}</span>
        </button>
      ))}
    </div>
  );
}
