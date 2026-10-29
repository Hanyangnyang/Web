// 컴포넌트: QR·학식·셔틀·기타 탭 하단 내비게이션 바 (iOS 리퀴드 글래스 스타일)
import React, { useRef, useState } from 'react';
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

const LONG_PRESS_MS = 250;
const DRAG_START_PX = 8;

export function BottomNav({ activeTab, setActiveTab, showMiscNew }: BottomNavProps) {
  const activeIndex = TABS.findIndex((tab) => tab.key === activeTab);

  // 꾹 누르거나 옆으로 밀면 캡슐을 손가락으로 끌고 다니다가, 손을 뗀 칸의 탭으로 전환
  const rowRef = useRef<HTMLDivElement>(null);
  const pressRef = useRef<{ x: number; pointerId: number; timer: number } | null>(null);
  const suppressClickRef = useRef(false);
  const [dragX, setDragX] = useState<number | null>(null);

  const pillOffset = (clientX: number) => {
    const rect = rowRef.current!.getBoundingClientRect();
    const pillWidth = rect.width / TABS.length;
    return Math.min(Math.max(clientX - rect.left - pillWidth / 2, 0), rect.width - pillWidth);
  };
  const indexAt = (offset: number) => {
    const pillWidth = rowRef.current!.getBoundingClientRect().width / TABS.length;
    return Math.round(offset / pillWidth);
  };
  const hoverIndex = dragX === null ? activeIndex : indexAt(dragX);

  const startDrag = (clientX: number) => {
    if (!pressRef.current) return;
    window.clearTimeout(pressRef.current.timer);
    // 드래그가 시작될 때만 포인터를 캡처 — 처음부터 캡처하면 일반 탭의 click이 탭 아이템까지 안 내려감
    rowRef.current?.setPointerCapture(pressRef.current.pointerId);
    setDragX(pillOffset(clientX));
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const clientX = e.clientX;
    pressRef.current = { x: clientX, pointerId: e.pointerId, timer: window.setTimeout(() => startDrag(clientX), LONG_PRESS_MS) };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragX !== null) {
      setDragX(pillOffset(e.clientX));
    } else if (pressRef.current && Math.abs(e.clientX - pressRef.current.x) > DRAG_START_PX) {
      startDrag(e.clientX);
    }
  };

  const endPress = (commit: boolean) => {
    if (pressRef.current) window.clearTimeout(pressRef.current.timer);
    pressRef.current = null;
    if (dragX === null) return;
    if (commit) setActiveTab(TABS[indexAt(dragX)].key);
    setDragX(null);
    // 드래그 후 손을 뗄 때 따라오는 click이 다른 탭을 다시 선택하지 않게 막음
    suppressClickRef.current = true;
    window.setTimeout(() => { suppressClickRef.current = false; }, 0);
  };

  const handleClick = (key: string) => {
    if (suppressClickRef.current) return;
    setActiveTab(key);
  };

  return (
    // 바깥 위치·크기(bottom-24px + h-16)는 sheetMetrics.ts의 88px 여백 계산과 맞물려 있어 유지
    <div className="fixed bottom-[calc(24px+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 w-[calc(100%-4rem)] max-w-[360px] h-16 p-1.5 rounded-full z-[1000] bg-white/10 backdrop-blur-[10px] backdrop-saturate-[1.8] border border-white/50 shadow-[0_8px_32px_rgba(15,23,42,0.14),0_2px_6px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.9),inset_0_-1px_1px_rgba(255,255,255,0.35)]">
      {/* 유리 표면 위쪽의 반사광 */}
      <div className="pointer-events-none absolute inset-0 rounded-full bg-[linear-gradient(180deg,rgba(255,255,255,0.25)_0%,rgba(255,255,255,0.03)_45%,rgba(255,255,255,0)_100%)]" />

      <div
        ref={rowRef}
        className="relative flex h-full items-center touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={() => endPress(true)}
        onPointerCancel={() => endPress(false)}
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* 선택된 탭 뒤에서 미끄러지는 물방울 캡슐 — 드래그 중엔 손가락을 바로 따라오고 살짝 부풀어 오름 */}
        {(activeIndex >= 0 || dragX !== null) && (
          <div
            className={`pointer-events-none absolute inset-y-0 left-0 rounded-full border border-white/70 ${
              dragX === null
                ? 'bg-white/35 shadow-[0_4px_14px_rgba(15,23,42,0.12),inset_0_1px_1px_rgba(255,255,255,1),inset_0_-2px_6px_rgba(14,74,132,0.08)] transition-transform duration-500 ease-[cubic-bezier(0.34,1.4,0.64,1)]'
                : 'bg-white/50 shadow-[0_8px_24px_rgba(15,23,42,0.18),inset_0_1px_1px_rgba(255,255,255,1)] transition-[background-color] duration-200'
            }`}
            style={{
              width: `${100 / TABS.length}%`,
              transform: dragX === null ? `translateX(${activeIndex * 100}%)` : `translateX(${dragX}px) scale(1.15)`,
            }}
          />
        )}

        {TABS.map(({ key, label, icon }, index) => (
          <div
            key={key}
            onClick={() => handleClick(key)}
            className={`relative z-[1] flex flex-1 flex-col items-center justify-center gap-0.5 h-full cursor-pointer transition-[color,transform] duration-300 active:scale-90 [-webkit-tap-highlight-color:transparent] ${
              hoverIndex === index ? 'text-hyu-blue-light' : 'text-slate-600'
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
