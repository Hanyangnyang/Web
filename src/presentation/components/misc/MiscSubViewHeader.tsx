// 컴포넌트: 기타탭 하위 View(짐/인스타그램/피드백) 공용 헤더 — 뒤로가기 버튼 + 제목
import { ArrowLeft } from 'lucide-react';

interface MiscSubViewHeaderProps {
  title: string;
  onBack: () => void;
}

export function MiscSubViewHeader({ title, onBack }: MiscSubViewHeaderProps) {
  return (
    <div className="flex items-center gap-4 mb-4">
      <button
        className="w-10 h-10 rounded-card bg-white border border-slate-200 flex items-center justify-center cursor-pointer text-text-main transition-all duration-200 hover:bg-surface"
        onClick={onBack}
      >
        <ArrowLeft size={20} />
      </button>
      <h2 className="text-xl font-bold text-text-main mb-0">{title}</h2>
    </div>
  );
}
