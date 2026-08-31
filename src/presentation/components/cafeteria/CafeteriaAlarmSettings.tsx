import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { useAlarmSubscription } from '../../hooks/useAlarmSubscription.js';
import { TimeDayWheelPicker } from '../ui/TimeDayWheelPicker.js';
import { ModalBottomSheet } from '../ui/ModalBottomSheet.js';
import { KNOWN_CAFES } from '../../../domain/entities/Cafe.js';

type AlarmMode = 'cafe' | 'keyword' | null;

interface CafeteriaAlarmParams {
  mode: AlarmMode;
  selectedCafe: string | null;
  keywords: string[];
  notifyTime: string;
  notifyDay: string;
}

const DEFAULT_PARAMS: CafeteriaAlarmParams = {
  mode: null,
  selectedCafe: null,
  keywords: [],
  notifyTime: '08:00',
  notifyDay: '당일',
};

export interface CafeteriaAlarmSettingsProps {
  onClose: (message?: string) => void;
}

export function CafeteriaAlarmSettings({ onClose }: CafeteriaAlarmSettingsProps) {
  const { enabled, params, setParams, ensureEnabled, toggle, commitOnClose } = useAlarmSubscription<CafeteriaAlarmParams>({
    topic: 'CAFETERIA_KEYWORD',
    storageKey: 'alarm_settings',
    defaultParams: DEFAULT_PARAMS,
    isSubscribed: (enabled, params) => enabled && (params.mode === 'cafe' || params.keywords.length > 0),
    buildSuccessMessage: () => '🔔 설정한 시간에 맞춰\n학식 알림을 보내드릴게요',
  });

  const [keywordInput, setKeywordInput] = useState('');

  const addKeyword = async () => {
    const trimmed = keywordInput.trim();
    if (trimmed) {
      const ok = await ensureEnabled();
      if (!ok) return;
      setParams(p => {
        if (!p.keywords.includes(trimmed)) {
          return { ...p, keywords: [...p.keywords, trimmed] };
        }
        return p;
      });
    }
    setKeywordInput('');
  };

  const removeKeyword = (kw: string) =>
    setParams(p => ({ ...p, keywords: p.keywords.filter(k => k !== kw) }));

  const isTimePickerActive = (params.mode === 'cafe' && params.selectedCafe !== null) || (params.mode === 'keyword' && params.keywords.length > 0);

  return (
    <ModalBottomSheet
      onRequestClose={commitOnClose}
      onClose={onClose}
      className="w-[calc(100%-48px)] max-w-[340px] rounded-card rounded-b-none px-5 pb-[calc(24px+env(safe-area-inset-bottom))] mb-0"
      scrollExemptSelector=".alarm-picker-scroll"
    >
      <div className="flex items-center justify-between py-3.5 pb-2.5 border-b border-slate-100 mb-0.5">
        <span className="text-[18px] font-extrabold text-text-main leading-none">학식 알림설정</span>
        <label className="alarm-toggle" style={{ marginLeft: 'auto', alignSelf: 'center' }}>
          <input type="checkbox" checked={enabled} onChange={toggle} />
          <span className="alarm-toggle-slider" />
        </label>
      </div>

      <div style={{
        opacity: enabled ? 1 : 0.35,
        transition: 'opacity 0.2s',
      }}>
        {/* 1단계: 알림 방식 선택 */}
        <div className="py-2.5 border-b border-slate-100">
          <div className="text-[14px] font-extrabold text-text-main mb-2.5">알림 방식 선택</div>
          <div className="flex flex-wrap gap-2 items-center">
            <button
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${params.mode === 'cafe'
                ? 'bg-primary text-white border-primary shadow-[0_2px_8px_rgba(14,74,132,0.18)]'
                : 'bg-white text-text-sub border-slate-200 hover:bg-slate-50'
                }`}
              onClick={async () => {
                const ok = await ensureEnabled();
                if (ok) setParams(p => ({ ...p, mode: p.mode === 'cafe' ? null : 'cafe' }));
              }}
            >
              식당별
            </button>
            <button
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${params.mode === 'keyword'
                ? 'bg-primary text-white border-primary shadow-[0_2px_8px_rgba(14,74,132,0.18)]'
                : 'bg-white text-text-sub border-slate-200 hover:bg-slate-50'
                }`}
              onClick={async () => {
                const ok = await ensureEnabled();
                if (ok) setParams(p => ({ ...p, mode: p.mode === 'keyword' ? null : 'keyword' }));
              }}
            >
              키워드
            </button>
          </div>
          <div className="text-[11px] text-slate-500 leading-relaxed px-0.5 mt-2">
            {params.mode === 'cafe'
              ? '선택한 식당의 알림을 받습니다.'
              : params.mode === 'keyword'
                ? '키워드가 메뉴에 포함되어 있을 때만 알림을 받습니다.'
                : '알림을 받아볼 방식을 선택해주세요.'
            }
          </div>
        </div>

        {/* 2단계: 식당 모드 상세 설정 */}
        <div style={{
          opacity: params.mode === 'cafe' ? 1 : 0,
          transform: params.mode === 'cafe' ? 'translateY(0)' : 'translateY(16px)',
          maxHeight: params.mode === 'cafe' ? '200px' : '0px',
          overflow: 'hidden',
          transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
          pointerEvents: params.mode === 'cafe' ? 'auto' : 'none',
          marginTop: params.mode === 'cafe' ? '8px' : '0px',
        }} className={params.mode === 'cafe' ? "py-2.5 border-b border-slate-100" : ""}>
          <div className="text-[14px] font-extrabold text-text-main mb-2.5">알림을 받아볼 식당 선택</div>
          <div className="flex flex-wrap gap-2 items-center">
            {KNOWN_CAFES.map(cafe => (
              <button
                key={cafe.id}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${params.selectedCafe === cafe.id
                  ? 'bg-primary text-white border-primary shadow-[0_2px_8px_rgba(14,74,132,0.18)]'
                  : 'bg-white border-slate-200 text-text-sub hover:border-primary/50'
                  }`}
                onClick={async () => {
                  const ok = await ensureEnabled();
                  if (ok) setParams(p => ({ ...p, selectedCafe: p.selectedCafe === cafe.id ? null : cafe.id }));
                }}
              >
                {cafe.name}
              </button>
            ))}
          </div>
        </div>

        {/* 2단계: 키워드 모드 상세 설정 */}
        <div style={{
          opacity: params.mode === 'keyword' ? 1 : 0,
          transform: params.mode === 'keyword' ? 'translateY(0)' : 'translateY(16px)',
          maxHeight: params.mode === 'keyword' ? '300px' : '0px',
          overflow: 'hidden',
          transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
          pointerEvents: params.mode === 'keyword' ? 'auto' : 'none',
          marginTop: params.mode === 'keyword' ? '8px' : '0px',
        }} className={params.mode === 'keyword' ? "py-2.5 border-b border-slate-100" : ""}>
          <div className="text-[14px] font-extrabold text-text-main mb-1.5">알림 키워드 등록</div>
          <div className="flex gap-2 mb-2">
            <input
              className="flex-1 h-10 border-[1.5px] border-slate-200 rounded-card px-3 text-[14px] text-text-main bg-surface outline-none transition-colors duration-200 focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.15)]"
              value={keywordInput}
              onChange={async (e) => {
                setKeywordInput(e.target.value);
                if (e.target.value.trim().length > 0) {
                  await ensureEnabled();
                }
              }}
              onKeyDown={e => e.key === 'Enter' && addKeyword()}
              placeholder="예: 제육, 돈까스"
            />
            <button
              className="w-10 h-10 bg-blue-500 text-white border-none rounded-card flex items-center justify-center cursor-pointer flex-shrink-0 transition-opacity duration-150 hover:opacity-[0.88]"
              onClick={addKeyword}
            >
              <Plus size={18} />
            </button>
          </div>
          {params.keywords.length > 0 && (
            <div className="flex flex-wrap gap-2 max-h-[88px] overflow-y-auto pr-1 no-scrollbar">
              {params.keywords.map(kw => (
                <span key={kw} className="flex items-center gap-1 bg-[rgba(59,130,246,0.1)] text-blue-500 text-[12px] font-bold px-3 py-1 rounded-full">
                  {kw}
                  <button
                    className="bg-none border-none text-blue-500 cursor-pointer flex items-center p-0 opacity-70 transition-opacity duration-150 hover:opacity-100"
                    onClick={() => removeKeyword(kw)}
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 3단계: 시간 설정 (조건 충족 시 활성화 - 부드럽게 Slide Up & Fade In) */}
        <div style={{
          opacity: isTimePickerActive ? 1 : 0,
          transform: isTimePickerActive ? 'translateY(0)' : 'translateY(24px)',
          maxHeight: isTimePickerActive ? '200px' : '0px',
          marginTop: isTimePickerActive ? '16px' : '0px',
          paddingTop: isTimePickerActive ? '4px' : '0px',
          pointerEvents: isTimePickerActive ? 'auto' : 'none',
          overflow: 'hidden',
          transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
          <div className="py-1">
            <div className="text-[14px] font-extrabold text-text-main mb-2">몇 시에 보낼까요?</div>
            <TimeDayWheelPicker
              value={params.notifyTime}
              onChange={async (t) => {
                const ok = await ensureEnabled();
                if (ok) setParams(p => ({ ...p, notifyTime: t }));
              }}
              day={params.notifyDay}
              onDayChange={async (d) => {
                const ok = await ensureEnabled();
                if (ok) setParams(p => ({ ...p, notifyDay: d }));
              }}
            />
          </div>
        </div>
      </div>
    </ModalBottomSheet>
  );
}
