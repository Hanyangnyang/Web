import { ArrowRight, Search } from 'lucide-react';
import { forwardRef } from 'react';

interface PlaylistSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder: string;
  className?: string;
}

// 홈 화면과 검색 결과 화면이 공유하는 검색바 — 단색 브랜드 블루 톤 + 아이콘 배지.
// Enter 또는 오른쪽 화살표 버튼을 누르면 onSubmit 호출
export const PlaylistSearchBar = forwardRef<HTMLInputElement, PlaylistSearchBarProps>(
  function PlaylistSearchBar({ value, onChange, onSubmit, placeholder, className = 'mb-4' }, ref) {
    return (
      <div
        className={`flex items-center gap-2 pl-2 pr-2.5 h-12 bg-playlist-primary/[0.06] border border-playlist-primary/20 rounded-full focus-within:border-playlist-primary focus-within:shadow-[0_0_0_3px_rgba(15,23,42,0.15)] transition-all ${className}`}
      >
        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-playlist-primary/15 flex items-center justify-center">
          <Search size={15} className="text-playlist-primary" />
        </span>
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSubmit();
          }}
          placeholder={placeholder}
          className="flex-1 min-w-0 bg-transparent text-sm text-text-main placeholder-text-hint outline-none"
        />
        <button
          onClick={onSubmit}
          disabled={!value.trim()}
          aria-label="검색"
          className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-playlist-primary text-white disabled:bg-slate-200 disabled:text-text-hint transition-all active:scale-90"
        >
          <ArrowRight size={14} />
        </button>
      </div>
    );
  }
);
