// 컴포넌트: 기타탭 하위 View(짐/인스타그램/피드백/중앙동아리) 공용 헤더 — 뒤로가기 버튼 + 제목 + (선택) 오른쪽 액션 버튼
import { type ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';

interface MiscSubViewHeaderProps {
  title: string;
  onBack: () => void;
  emoji?: string;
  subtitle?: string;
  subtitleLoading?: boolean; // 부제목을 API로 받아오는 중이면 글자 대신 shimmer 막대를 보여줌
  rightAction?: ReactNode;
}

export function MiscSubViewHeader({ title, onBack, emoji, subtitle, subtitleLoading, rightAction }: MiscSubViewHeaderProps) {
  return (
    <header className="flex items-center gap-4 mb-3">
      <button
        className="relative before:content-[''] before:absolute before:-inset-1.5 w-10 h-10 rounded-card bg-white border border-slate-200 flex items-center justify-center text-text-sub shadow-[0_2px_4px_rgba(0,0,0,0.02)] transition-all duration-200 hover:bg-surface"
        onClick={onBack}
      >
        <ArrowLeft size={20} />
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 min-w-0">
          <h1 className="text-xl font-bold text-text-main m-0 truncate">
            {title}
            {emoji}
          </h1>
        </div>
        {subtitleLoading && <div className="h-3.5 w-48 max-w-full rounded-full skeleton-shimmer" />}
        {!subtitleLoading && subtitle && <p className="text-[0.8rem] text-text-sub font-medium m-0 truncate">{subtitle}</p>}
      </div>
      {rightAction && <div className="flex-shrink-0">{rightAction}</div>}
    </header>
  );
}
