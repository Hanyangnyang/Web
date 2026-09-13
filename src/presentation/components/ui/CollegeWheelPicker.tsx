// 단과대 선택용 휠피커 — 네이티브 <select>는 모바일에서 화면 전체를 덮는 시스템 피커를 띄우므로,
// 셔틀·지하철 탭의 기간/요일 선택기(ShuttleView.jsx)와 동일한 스크롤-스냅 휠피커 UI로 대체한다.
import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface Option {
  id: string;
  label: string;
}

interface Props {
  options: Option[];    // '전체' 항목까지 포함해서 그대로 전달
  value: string;
  onChange: (id: string) => void;
  triggerClassName: string;
  onOpen?: () => void;  // 피커가 열릴 때 호출 (예: 접힌 바텀시트를 펼치는 용도)
}

const ITEM_HEIGHT = 36;
const VISIBLE_COUNT = 5;
const PAD_COUNT = Math.floor(VISIBLE_COUNT / 2);

export function CollegeWheelPicker({ options, value, onChange, triggerClassName, onOpen }: Props) {
  const [open, setOpen] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 열릴 때 현재 값으로 로컬 상태 초기화, 닫힐 때 부모에 커밋 (셔틀 선택기와 동일 패턴)
  useEffect(() => {
    if (open) {
      setLocalValue(value);
    } else if (localValue !== value) {
      onChange(localValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // 열릴 때 현재 선택값이 중앙에 오도록 스크롤 위치 초기화
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      const idx = options.findIndex((o) => o.id === value);
      if (scrollRef.current && idx !== -1) scrollRef.current.scrollTop = idx * ITEM_HEIGHT;
    }, 50);
    return () => clearTimeout(timer);
  }, [open, value, options]);

  const selectedLabel = options.find((o) => o.id === value)?.label ?? options[0]?.label ?? '';

  return (
    <div className="relative select-none" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((p) => {
          if (!p) onOpen?.();
          return !p;
        })}
        className={triggerClassName}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown size={12} className={`flex-shrink-0 text-text-hint transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-[calc(100%+6px)] right-0 w-[170px] bg-white border border-[#e2e8f0] rounded-card shadow-[0_16px_40px_rgba(0,0,0,0.18)] overflow-hidden z-[200] [animation:sttDropIn_0.18s_cubic-bezier(0.16,1,0.3,1)]">
          <div className="relative" style={{ height: ITEM_HEIGHT * VISIBLE_COUNT }}>
            {/* 선택 하이라이트 바 */}
            <div
              style={{
                position: 'absolute', top: '50%', left: 6, right: 6, height: ITEM_HEIGHT,
                transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.06)', borderRadius: 8,
                pointerEvents: 'none', zIndex: 10,
              }}
            />
            <div
              ref={scrollRef}
              className="h-full overflow-y-auto no-scrollbar snap-y snap-mandatory relative z-0"
              onScroll={(e) => {
                const idx = Math.round(e.currentTarget.scrollTop / ITEM_HEIGHT);
                const opt = options[idx];
                if (opt && opt.id !== localValue) setLocalValue(opt.id);
              }}
            >
              <div style={{ height: ITEM_HEIGHT * PAD_COUNT }} />
              {options.map((o, i) => (
                <div
                  key={o.id}
                  style={{
                    height: ITEM_HEIGHT, scrollSnapAlign: 'center',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: localValue === o.id ? 700 : 400,
                    color: localValue === o.id ? '#1e293b' : '#cbd5e1',
                    transition: 'all 0.2s', cursor: 'pointer', padding: '0 10px', textAlign: 'center',
                  }}
                  onClick={() => {
                    setLocalValue(o.id);
                    if (scrollRef.current) scrollRef.current.scrollTop = i * ITEM_HEIGHT;
                  }}
                >
                  {o.label}
                </div>
              ))}
              <div style={{ height: ITEM_HEIGHT * PAD_COUNT }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
