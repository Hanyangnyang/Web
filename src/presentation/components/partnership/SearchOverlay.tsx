// 매장 통합 검색 오버레이
// - 결과는 카테고리별 그룹핑 (여러 카테고리에 걸칠 때만 섹션 헤더 표시)
// - 폐업 매장도 뱃지와 함께 노출 ("이 가게 제휴 되나?"의 답이므로)
// - 결과 없음: 제보하기 + PostHog zero-result 로깅 (수요 데이터 수집)
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Search, X, MapPin, Send } from 'lucide-react';
import { usePostHog } from 'posthog-js/react';
import { supabase } from '../../../lib/supabase.js';
import { getPlatform } from '../../../lib/platform.js';
import {
  searchStores, groupByCategory, activePartnerships,
  CATEGORY_META, type PartnerStore,
} from './storeData';

interface Props {
  onClose: () => void;
  onSelect: (store: PartnerStore) => void;
}

type ReportState = 'idle' | 'sending' | 'done';

export function SearchOverlay({ onClose, onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [reportState, setReportState] = useState<ReportState>('idle');
  const inputRef = useRef<HTMLInputElement>(null);
  const posthog = usePostHog();

  const results = useMemo(() => searchStores(query), [query]);
  const groups = useMemo(() => groupByCategory(results), [results]);
  const trimmed = query.trim();
  const noResult = trimmed.length > 0 && results.length === 0;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // 검색어가 바뀌면 제보 상태 초기화
  useEffect(() => {
    setReportState('idle');
  }, [trimmed]);

  // 결과 없는 검색어 로깅 (800ms 디바운스) — 사용자들이 찾지만 우리에게 없는 매장 = 수요 데이터
  useEffect(() => {
    if (!noResult) return;
    const timer = setTimeout(() => {
      posthog?.capture('partner_map_search_no_result', { query: trimmed });
    }, 800);
    return () => clearTimeout(timer);
  }, [noResult, trimmed, posthog]);

  const handleReport = async () => {
    if (reportState !== 'idle') return;
    setReportState('sending');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      let userId = session?.user?.id;
      if (!userId) {
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error) throw error;
        userId = data.session?.user?.id;
      }
      const { error } = await supabase.from('feedbacks').insert({
        user_id: userId,
        content: `[지도 매장 제보] ${trimmed}`,
        platform: getPlatform(),
      });
      if (error) throw error;
      posthog?.capture('partner_map_store_reported', { query: trimmed });
      setReportState('done');
    } catch (err) {
      console.error('Failed to report store:', err);
      setReportState('idle');
      alert('제보 전송에 실패했어요. 잠시 후 다시 시도해 주세요.');
    }
  };

  return (
    <div className="absolute inset-0 z-30 bg-white flex flex-col">
      {/* 검색 입력 헤더 */}
      <div className="flex items-center gap-2 px-3 py-3 border-b border-[#f1f5f9]">
        <button
          onClick={onClose}
          className="p-1.5 [-webkit-tap-highlight-color:transparent] active:scale-90 transition-transform"
          aria-label="검색 닫기"
        >
          <ArrowLeft size={20} className="text-text-main" />
        </button>
        <div className="flex-1 flex items-center gap-2 bg-surface rounded-full px-3.5 py-2.5">
          <Search size={15} className="text-text-hint flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="매장명으로 검색"
            className="flex-1 bg-transparent text-[14px] text-text-main placeholder-text-hint outline-none font-semibold"
          />
          {query && (
            <button onClick={() => setQuery('')} className="flex-shrink-0 active:scale-90 transition-transform" aria-label="지우기">
              <X size={15} className="text-text-hint" />
            </button>
          )}
        </div>
      </div>

      {/* 결과 영역 — 하단 여백은 플로팅 BottomNav에 마지막 행이 가리지 않게 */}
      <div className="flex-1 overflow-y-auto pb-[130px]">
        {trimmed.length === 0 && (
          <p className="text-center text-[12px] text-text-hint font-medium pt-14">
            제휴 매장 이름을 검색해보세요
          </p>
        )}

        {groups.map(({ category, stores }) => (
          <div key={category}>
            {/* 여러 카테고리에 걸칠 때만 섹션 헤더 표시 */}
            {groups.length > 1 && (
              <p className="px-4 pt-4 pb-1 text-[11px] font-extrabold text-text-hint">
                {CATEGORY_META[category].emoji} {CATEGORY_META[category].label}
              </p>
            )}
            {stores.map((store) => {
              const colleges = activePartnerships(store);
              const closed = !store.is_active;
              return (
                <button
                  key={store.id}
                  disabled={closed}
                  onClick={() => onSelect(store)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left [-webkit-tap-highlight-color:transparent] ${
                    closed ? 'opacity-45' : 'active:bg-slate-50'
                  }`}
                >
                  <span className="text-xl flex-shrink-0">{store.emoji || CATEGORY_META[store.category].emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[14px] font-extrabold text-text-main truncate">{store.name}</span>
                      <span className="text-[10px] font-bold text-text-hint">{CATEGORY_META[store.category].label}</span>
                      {closed && (
                        <span className="text-[9px] font-bold px-1 py-px rounded bg-red-50 text-red-400 border border-red-100">폐업</span>
                      )}
                    </div>
                    {store.location.address && (
                      <p className="text-[11px] text-text-hint font-medium truncate mt-0.5">{store.location.address}</p>
                    )}
                  </div>
                  {!closed && colleges.length > 0 && (
                    <span className="flex-shrink-0 text-[10px] font-bold text-white bg-hyu-blue-light px-1.5 py-0.5 rounded-full">
                      {colleges.length === 1 ? colleges[0].college_name.replace(/\n/g, '') : `${colleges.length}개 단과대`}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}

        {/* 결과 없음 — 여긴 막다른 길이 아니라 제보 창구 */}
        {noResult && (
          <div className="flex flex-col items-center pt-14 px-6 text-center">
            <MapPin size={28} className="text-text-hint" />
            <p className="text-[14px] font-extrabold text-text-main mt-3">검색 결과가 없어요</p>
            <p className="text-[12px] text-text-hint font-medium mt-1 leading-relaxed">
              찾으시는 매장이 지도에 있어야 한다면<br />제보해 주세요. 다음 업데이트에 반영할게요!
            </p>
            {reportState === 'done' ? (
              <p className="mt-4 text-[13px] font-extrabold text-emerald-600">제보가 접수됐어요, 고마워요! 🎉</p>
            ) : (
              <button
                onClick={handleReport}
                disabled={reportState === 'sending'}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#0E4A84] text-white text-[13px] font-bold active:scale-[0.96] transition-transform disabled:opacity-60"
              >
                <Send size={13} />
                {reportState === 'sending' ? '전송 중…' : `'${trimmed}' 제보하기`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
