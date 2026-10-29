// 컴포넌트: QR·학식·셔틀·기타 탭 하단 내비게이션 바 (iOS 리퀴드 글래스 스타일)
import React from 'react';
import { BookOpen, Utensils, LayoutGrid, Megaphone, Map } from 'lucide-react';

const BusIcon = () => (
  <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="13" rx="2" />
    <path d="M2 11h20" />
    <circle cx="7" cy="18" r="1.5" /><circle cx="17" cy="18" r="1.5" />
  </svg>
);

// 도서관 탭 임시 비활성화 (보안 이슈 및 회원가입 개편 전까지)
// { key: 'qr', label: '도서관', icon: <BookOpen size={24} /> },
const TABS = [
  { key: 'cafe', label: '학식', icon: <Utensils size={24} /> },
  { key: 'shuttle', label: '셔틀·지하철', icon: <BusIcon /> },
  { key: 'portal', label: '소식', icon: <Megaphone size={24} /> },
  { key: 'partner', label: '캠퍼스맵', icon: <Map size={24} /> },
  { key: 'misc', label: '기타', icon: <LayoutGrid size={24} /> },
];

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  showMiscNew: boolean;
}

export function BottomNav({ activeTab, setActiveTab, showMiscNew }: BottomNavProps) {
  const activeIndex = TABS.findIndex((tab) => tab.key === activeTab);

  return (
    // 바깥 위치·크기(bottom-24px + h-16)는 sheetMetrics.ts의 88px 여백 계산과 맞물려 있어 유지
    <div className="fixed bottom-[calc(24px+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 w-[calc(100%-4rem)] max-w-[360px] h-16 p-1.5 rounded-full z-[1000] bg-white/10 backdrop-blur-[10px] backdrop-saturate-[1.8] border border-white/50 shadow-[0_8px_32px_rgba(15,23,42,0.14),0_2px_6px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.9),inset_0_-1px_1px_rgba(255,255,255,0.35)]">
      {/* 유리 표면 위쪽의 반사광 */}
      <div className="pointer-events-none absolute inset-0 rounded-full bg-[linear-gradient(180deg,rgba(255,255,255,0.25)_0%,rgba(255,255,255,0.03)_45%,rgba(255,255,255,0)_100%)]" />

      <div className="relative flex h-full items-center">
        {/* 선택된 탭 뒤에서 미끄러지는 물방울 캡슐 */}
        {activeIndex >= 0 && (
          <div
            className="pointer-events-none absolute inset-y-0 left-0 rounded-full bg-white/35 border border-white/70 shadow-[0_4px_14px_rgba(15,23,42,0.12),inset_0_1px_1px_rgba(255,255,255,1),inset_0_-2px_6px_rgba(14,74,132,0.08)] transition-transform duration-500 ease-[cubic-bezier(0.34,1.4,0.64,1)]"
            style={{ width: `${100 / TABS.length}%`, transform: `translateX(${activeIndex * 100}%)` }}
          />
        )}

        {TABS.map(({ key, label, icon }) => (
          <div
            key={key}
            onClick={() => setActiveTab(key)}
            className={`relative z-[1] flex flex-1 flex-col items-center justify-center gap-0.5 h-full cursor-pointer transition-[color,transform] duration-300 active:scale-90 [-webkit-tap-highlight-color:transparent] ${
              activeTab === key ? 'text-hyu-blue-light' : 'text-slate-600'
            }`}
          >
            {key === 'misc' && showMiscNew && (
              <span className="pointer-events-none absolute -top-3 right-0 whitespace-nowrap rounded-full bg-red-500 px-2.5 py-[5px] text-[10px] font-extrabold leading-none text-white shadow-sm">NEW</span>
            )}
            {icon}
            <span className="text-[0.65rem] font-semibold whitespace-nowrap">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
