// 컴포넌트: "학교 셔틀" / "일반 버스" 전환 pill 스위치 (헤더에서 두 화면 모두 사용)
import { usePostHog } from 'posthog-js/react';

interface ViewModeToggleProps {
  viewMode: 'shuttle' | 'bus';
  setViewMode: (mode: 'shuttle' | 'bus') => void;
}

export function ViewModeToggle({ viewMode, setViewMode }: ViewModeToggleProps) {
  const posthog = usePostHog();

  return (
    <div className="relative flex bg-[#e8e8e8]/80 p-[2.5px] rounded-xl">
      <div
        className="absolute top-[2.5px] bottom-[2.5px] left-[2.5px] rounded-[9px] transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]"
        style={{
          width: 'calc(50% - 2.5px)',
          transform: viewMode === 'shuttle' ? 'translateX(0)' : 'translateX(100%)',
          backgroundColor: viewMode === 'shuttle' ? '#0E4A84' : '#53B332',
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
        }}
      />
      <button onClick={() => setViewMode('shuttle')} className={`px-4 py-[4px] text-[11.5px] font-black rounded-[9px] transition-colors duration-300 relative z-10 ${viewMode === 'shuttle' ? 'text-white' : 'text-slate-500'}`}>학교 셔틀</button>
      <button onClick={() => { posthog?.capture('shuttle_view_mode_changed', { viewMode: 'bus' }); setViewMode('bus'); }} className={`px-4 py-[4px] text-[11.5px] font-black rounded-[9px] transition-colors duration-300 relative z-10 ${viewMode === 'bus' ? 'text-white' : 'text-slate-500'}`}>일반 버스</button>
    </div>
  );
}
