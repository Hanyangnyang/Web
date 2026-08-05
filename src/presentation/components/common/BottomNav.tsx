// 컴포넌트: QR·학식·셔틀·소식·제휴·기타 탭 하단 내비게이션 바
import React from 'react';
import { Utensils, LayoutGrid, Megaphone, Handshake } from 'lucide-react';

const BusIcon = () => (
  <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="13" rx="2" />
    <path d="M2 11h20" />
    <circle cx="7" cy="18" r="1.5" />
    <circle cx="17" cy="18" r="1.5" />
  </svg>
);

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TABS = [
  { id: 'cafe', label: '학식', Icon: Utensils },
  { id: 'shuttle', label: '셔틀·지하철', Icon: BusIcon },
  { id: 'portal', label: '소식', Icon: Megaphone },
  { id: 'partner', label: '제휴', Icon: Handshake },
  { id: 'misc', label: '기타', Icon: LayoutGrid },
];

export function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
  const activeIndex = TABS.findIndex((t) => t.id === activeTab);

  return (
    <nav className="fixed bottom-[calc(20px+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[380px] h-[64px] bg-white/90 backdrop-blur-2xl backdrop-saturate-200 border border-slate-200/90 rounded-full z-[1000] p-1.5 flex items-center justify-between shadow-[0_12px_36px_-6px_rgba(15,23,42,0.12),0_4px_16px_-2px_rgba(15,23,42,0.06),0_0_0_1px_rgba(15,23,42,0.04)] select-none">
      <div className="relative w-full h-full flex items-center justify-between">
        {/* 2026 트렌디 슬라이딩 액티브 캡슐 */}
        {activeIndex !== -1 && (
          <div
            className="absolute top-0 bottom-0 rounded-full bg-gradient-to-r from-[#0E4A84] to-[#12589d] shadow-[0_4px_14px_rgba(14,74,132,0.32)] transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] pointer-events-none"
            style={{
              left: `${activeIndex * 20}%`,
              width: '20%',
            }}
          />
        )}

        {/* 탭 버튼 항목들 */}
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const IconComponent = tab.Icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`relative z-10 flex flex-col items-center justify-center gap-0.5 flex-1 h-full rounded-full transition-all duration-200 [-webkit-tap-highlight-color:transparent] active:scale-95 cursor-pointer ${
                isActive
                  ? 'text-white font-bold'
                  : 'text-slate-500 hover:text-slate-800 font-semibold'
              }`}
            >
              <IconComponent
                className={`transition-transform duration-200 ${
                  isActive ? 'scale-110 stroke-[2.2]' : 'scale-100 opacity-80'
                }`}
                size={20}
              />
              <span className="text-[0.68rem] leading-none tracking-tight">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

