// 컴포넌트: 학식 탭 상단 날짜 이동 헤더
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDate } from './cafeteriaFormat.js';

interface DateNavigatorProps {
  date: Date;
  loading: boolean;
  onPrev: () => void;
  onNext: () => void;
}

export function DateNavigator({ date, loading, onPrev, onNext }: DateNavigatorProps) {
  return (
    <div className="flex justify-between items-center mb-2 bg-white px-5 py-2 rounded-card border border-[#e2e8f0] shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
      <button
        className="bg-none border-none text-text-sub cursor-pointer p-1 flex items-center justify-center transition-colors duration-200 hover:text-text-main"
        onClick={onPrev}
        disabled={loading}
      >
        <ChevronLeft style={{ opacity: loading ? 0.3 : 1 }} />
      </button>
      <div className="text-[1.1rem] font-bold text-text-main font-['Outfit',sans-serif]" style={{ opacity: loading ? 0.5 : 1 }}>
        {formatDate(date)}
      </div>
      <button
        className="bg-none border-none text-text-sub cursor-pointer p-1 flex items-center justify-center transition-colors duration-200 hover:text-text-main"
        onClick={onNext}
        disabled={loading}
      >
        <ChevronRight style={{ opacity: loading ? 0.3 : 1 }} />
      </button>
    </div>
  );
}
