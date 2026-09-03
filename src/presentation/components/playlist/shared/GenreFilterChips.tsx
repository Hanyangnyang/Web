import { GENRES } from '../playlistTypes';

interface GenreFilterChipsProps {
  selectedGenre: string;
  onSelectGenre: (key: string) => void;
  className?: string;
}

const ALL_CHIP_ACTIVE = 'bg-slate-700 text-white border-transparent shadow-[0_2px_6px_rgba(51,65,85,0.25)]';
const ALL_CHIP_INACTIVE = 'bg-slate-200 text-slate-800 border-slate-400';

export function GenreFilterChips({ selectedGenre, onSelectGenre, className = '' }: GenreFilterChipsProps) {
  return (
    <div
      className={`flex gap-2 overflow-x-auto px-4 ml-[-1rem] [&::-webkit-scrollbar]:hidden ${className}`}
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      {GENRES.map((genre) => (
        <button
          key={genre.key}
          onClick={() => onSelectGenre(genre.key)}
          className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap border transition-all duration-200 active:scale-[0.96] ${
            selectedGenre === genre.key && genre.key !== 'all'
              ? `${genre.active} text-white border-transparent shadow-[0_2px_6px_rgba(14,74,132,0.25)]`
              : genre.key === 'all'
                ? (selectedGenre === 'all' ? ALL_CHIP_ACTIVE : ALL_CHIP_INACTIVE)
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
