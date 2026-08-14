// 컴포넌트: 기타탭 하위 View(짐/인스타그램/피드백) 공용 헤더 — 뒤로가기 버튼 + 제목
import { ArrowLeft } from 'lucide-react';

interface MiscSubViewHeaderProps {
  title: string;
  onBack: () => void;
  emoji?: string;
  subtitle?: string;
  rightAction?: React.ReactNode;
}

export function MiscSubViewHeader({ title, onBack, emoji, subtitle, rightAction }: MiscSubViewHeaderProps) {
  return (
    <header className="flex items-center gap-4 mb-3">
      <button
        className="w-10 h-10 rounded-card bg-white border border-slate-200 flex items-center justify-center text-text-sub shadow-[0_2px_4px_rgba(0,0,0,0.02)] transition-all duration-200 hover:bg-surface"
        onClick={onBack}
      >
        <ArrowLeft size={20} />
      </button>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-xl font-bold text-text-main m-0">
            {title}
            {emoji && <span className="ml-2">{emoji}</span>}
          </h1>
        </div>
        {subtitle && <p className="text-[0.8rem] text-text-sub font-medium m-0">{subtitle}</p>}
      </div>
      {rightAction && <div className="flex-shrink-0">{rightAction}</div>}
    </header>
  );
}
