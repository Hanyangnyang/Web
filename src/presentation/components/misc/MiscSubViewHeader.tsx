// 컴포넌트: 기타탭 하위 View(짐/인스타그램/피드백/중앙동아리) 공용 헤더 — 뒤로가기 버튼 + 제목 + (선택) 오른쪽 액션 버튼
import { type ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';

interface MiscSubViewHeaderProps {
  title: string;
  onBack: () => void;
  rightAction?: ReactNode;
}

export function MiscSubViewHeader({ title, onBack, rightAction }: MiscSubViewHeaderProps) {
  return (
    <div className="flex items-center gap-4 mb-4">
      <button
        className="w-10 h-10 rounded-card bg-white border border-slate-200 flex items-center justify-center cursor-pointer text-text-main transition-all duration-200 hover:bg-surface"
        onClick={onBack}
      >
        <ArrowLeft size={20} />
      </button>
      <h2 className="flex-1 text-xl font-bold text-text-main mb-0">{title}</h2>
      {rightAction}
    </div>
  );
}
