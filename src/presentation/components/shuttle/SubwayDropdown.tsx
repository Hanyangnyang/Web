// 컴포넌트: 지하철 노선(4호선/수인분당선 상하행) 선택 드롭다운
import { useState, useEffect, useRef } from 'react';
import { SUBWAY_OPTS } from '../../../domain/entities/Subway.js';
import { LineBadge } from './LineBadge.jsx';

interface SubwayDropdownProps {
  selected: string;
  onChange: (id: string) => void;
}

export function SubwayDropdown({ selected, onChange }: SubwayDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  // selected가 SUBWAY_OPTS에 없을 수 있음(예: 노선 개편 후 남은 오래된 localStorage 값) — 못 찾으면 첫 옵션으로 대체
  const opt = SUBWAY_OPTS.find(o => o.id === selected) ?? SUBWAY_OPTS[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const line4 = SUBWAY_OPTS.filter(o => o.line === '4호선');
  const sb = SUBWAY_OPTS.filter(o => o.line === '수인분당선');

  return (
    <div className="relative select-none w-full min-w-0" ref={ref}>
      <div
        className={`flex items-center gap-2 px-[10px] py-[7px] pl-2 bg-white border-[1.5px] rounded-card cursor-pointer transition-all duration-150 shadow-[0_1px_4px_rgba(0,0,0,0.06)] w-full min-w-0 h-[44px] ${open ? 'border-primary shadow-[0_0_0_3px_rgba(14,74,132,0.2)]' : 'border-slate-200'}`}
        onClick={() => setOpen(p => !p)}
      >
        <LineBadge opt={opt} size={28} />
        <div className="flex flex-col gap-px flex-1 min-w-0">
          <span className="text-[clamp(8px,2vw,9px)] font-bold text-text-hint tracking-[0.04em] whitespace-nowrap overflow-hidden text-ellipsis">{opt.line} · {opt.dir}</span>
          <span className="text-[clamp(12px,3vw,13px)] font-extrabold text-text-main whitespace-nowrap overflow-hidden text-ellipsis">{opt.dest}</span>
        </div>
        <svg
          className={`text-text-hint transition-transform duration-200 flex-shrink-0 ${open ? 'rotate-180' : ''}`}
          width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>

      {open && (
        <div className="absolute top-[calc(100%+6px)] right-0 w-[232px] bg-white border border-slate-200 rounded-card shadow-[0_16px_40px_rgba(0,0,0,0.14)] overflow-hidden z-[200] [animation:sttDropIn_0.18s_cubic-bezier(0.16,1,0.3,1)]">
          {[{ label: '4호선', items: line4 }, { label: '수인분당선', items: sb }].map(({ label, items }) => (
            <div key={label}>
              <div className="flex items-center gap-[7px] px-3.5 pt-[9px] pb-1.5 text-[10px] font-bold text-text-hint tracking-[0.05em] border-t border-surface first:border-t-0">
                <LineBadge opt={items[0]} size={18} /><span>{label}</span>
              </div>
              {items.map(o => (
                <div
                  key={o.id}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 cursor-pointer transition-colors duration-100 hover:bg-surface ${selected === o.id ? 'bg-[rgba(14,74,132,0.04)]' : ''}`}
                  onClick={() => { onChange(o.id); setOpen(false); }}
                >
                  <div className="flex-1">
                    <p className="text-[13px] font-bold text-text-main m-0">{o.dest}</p>
                    <p className="text-[11px] text-text-hint mt-0.5 mb-0">{o.dir} · 한대앞역 출발</p>
                  </div>
                  <div className={`w-[17px] h-[17px] rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors duration-150 ${selected === o.id ? 'border-primary' : 'border-slate-200'}`}>
                    {selected === o.id && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
