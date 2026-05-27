// 컴포넌트: QR·식단·셔틀·기타 탭 하단 내비게이션 바
import React from 'react';
import { BookOpen, Utensils, LayoutGrid, Megaphone } from 'lucide-react';

const BusIcon = () => (
  <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="13" rx="2" />
    <path d="M2 11h20" />
    <circle cx="7" cy="18" r="1.5" /><circle cx="17" cy="18" r="1.5" />
  </svg>
);

export function BottomNav({ activeTab, setActiveTab }) {
  const itemClass = (tab) =>
    `flex flex-col items-center gap-1 cursor-pointer transition-colors duration-300 flex-1 py-2 [-webkit-tap-highlight-color:transparent] ${
      activeTab === tab ? 'text-hyu-blue-light' : 'text-text-hint'
    }`;

  return (
    <div className="fixed bottom-[calc(24px+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 w-[calc(100%-4rem)] max-w-[360px] h-16 bg-[rgba(15,23,42,0.8)] backdrop-blur-[20px] border border-white/10 rounded-full flex justify-around items-center z-[1000] shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
      <div className={itemClass('cafe')} onClick={() => setActiveTab('cafe')}>
        <Utensils size={24} />
        <span className="text-[0.7rem] font-semibold">학식</span>
      </div>
      <div className={itemClass('shuttle')} onClick={() => setActiveTab('shuttle')}>
        <BusIcon />
        <span className="text-[0.7rem] font-semibold">셔틀·지하철</span>
      </div>
      {/* 도서관 탭 임시 비활성화 (보안 이슈 및 회원가입 개편 전까지)
      <div className={itemClass('qr')} onClick={() => setActiveTab('qr')}>
        <BookOpen size={24} />
        <span className="text-[0.7rem] font-semibold">도서관</span>
      </div>
      */}
      <div className={itemClass('portal')} onClick={() => setActiveTab('portal')}>
        <Megaphone size={24} />
        <span className="text-[0.7rem] font-semibold">소식</span>
      </div>
      <div className={itemClass('misc')} onClick={() => setActiveTab('misc')}>
        <LayoutGrid size={24} />
        <span className="text-[0.7rem] font-semibold">기타</span>
      </div>
    </div>
  );
}
