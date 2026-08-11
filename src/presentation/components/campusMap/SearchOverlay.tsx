// 캠퍼스맵 통합 검색 오버레이 (제휴 매장 + 교내시설)
// - 매장 결과는 카테고리별 그룹핑, 교내시설은 별도 섹션으로 먼저 보여준다
// - 폐업 매장도 뱃지와 함께 노출 ("이 가게 제휴 되나?"의 답이므로)
// - 결과 없음: 제보하기 + PostHog zero-result 로깅 (수요 데이터 수집)
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Search, X, MapPin, Send } from 'lucide-react';
import { usePostHog } from 'posthog-js/react';
import {
  searchStores, groupByCategory, activePartnerships,
  CATEGORY_META, type PartnerStore,
} from '../../../domain/entities/PartnerStore.js';
import { searchBuildings, type CampusBuilding } from '../../../domain/entities/CampusBuilding.js';
import { usePartnerStores } from '../../hooks/campusMap/usePartnerStores.js';
import { useCampusBuildings } from '../../hooks/campusMap/useCampusBuildings.js';
import { useFeedback } from '../../hooks/useFeedback.js';

/**
 * 한 섹션의 상태 한 줄.
 * 매장과 교내시설은 서로 다른 JSON에서 오므로 한쪽이 실패해도 다른 쪽 결과는 계속 보여준다 —
 * 지도에서 "한 레이어가 실패해도 나머지는 쓸 수 있어야 한다"고 정한 것과 같은 원칙이다.
 */
function SectionStatus({ error, loading }: { error: string | null; loading: boolean }) {
  if (error) return <p className="px-4 pb-2 text-[12px] text-red-500 font-medium">{error}</p>;
  if (loading) return <p className="px-4 pb-2 text-[12px] text-text-hint font-medium animate-pulse">불러오는 중…</p>;
  return null;
}

interface Props {
  onClose: () => void;
  onSelect: (store: PartnerStore) => void;
  onSelectBuilding: (building: CampusBuilding) => void;
}

export function SearchOverlay({ onClose, onSelect, onSelectBuilding }: Props) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const posthog = usePostHog();
  // 제보는 기타탭 피드백과 같은 경로를 쓴다 (useFeedback → UseCase → Repository → Supabase).
  // 예전엔 여기서 supabase를 직접 호출해 레이어를 건너뛰고 있었다.
  const { loading: reporting, submitted: reported, error: reportError, submit: submitFeedback, reset: resetReport } = useFeedback();
  // CampusMapView와 같은 queryKey를 공유하는 RQ 캐시라 별도 네트워크 요청 없이 재사용된다.
  // 건물은 칩과 무관하게 검색 대상이라 여기선 항상 enabled — 이미 받아왔다면 캐시에서 즉시 나온다.
  const { stores, loading: storesLoading, loadErr: storesError } = usePartnerStores();
  const { buildings, loading: buildingsLoading, loadErr: buildingsError } = useCampusBuildings({ enabled: true });
  // 로딩·실패는 아래에서 섹션별로 따로 알린다. 여기 합친 값은 '결과 없음' 판정 전용 —
  // 어느 한쪽이라도 아직 안 왔거나 실패한 상태에서 "없어요"를 띄우면,
  // 있는 매장을 없다고 오해해 잘못된 제보를 하게 된다.
  const dataLoading = storesLoading || buildingsLoading;
  const dataError = storesError ?? buildingsError;

  const results = useMemo(() => searchStores(stores, query), [stores, query]);
  const groups = useMemo(() => groupByCategory(results), [results]);
  const buildingResults = useMemo(() => searchBuildings(buildings, query), [buildings, query]);
  const trimmed = query.trim();
  const noResult = trimmed.length > 0 && !dataLoading && !dataError && results.length === 0 && buildingResults.length === 0;
  // 교내시설 결과가 섞이면 매장 쪽도 헤더가 있어야 무엇이 무엇인지 구분된다
  const showSectionHeaders = groups.length > 1 || buildingResults.length > 0;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // 결과 없는 검색어 로깅 (800ms 디바운스) — 사용자들이 찾지만 우리에게 없는 매장 = 수요 데이터
  useEffect(() => {
    if (!noResult) return;
    const timer = setTimeout(() => {
      posthog?.capture('partner_map_search_no_result', { query: trimmed });
    }, 800);
    return () => clearTimeout(timer);
  }, [noResult, trimmed, posthog]);

  // 검색어가 바뀌면 이전 제보 결과는 다른 맥락이 되므로 지운다.
  // (effect가 아니라 입력 핸들러에서 처리 — 렌더 중 상태를 되돌리는 연쇄를 만들지 않기 위해)
  const handleQueryChange = (next: string) => {
    setQuery(next);
    if (reported || reportError) resetReport();
  };

  const handleReport = async () => {
    if (reporting || reported) return;
    try {
      await submitFeedback(`[지도 매장 제보] ${trimmed}`);
      posthog?.capture('partner_map_store_reported', { query: trimmed });
    } catch {
      // 실패 메시지는 useFeedback의 error가 화면에 직접 노출한다
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
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="캠퍼스맵 검색"
            className="flex-1 bg-transparent text-[14px] text-text-main placeholder-text-hint outline-none font-semibold"
          />
          {query && (
            <button onClick={() => handleQueryChange('')} className="flex-shrink-0 active:scale-90 transition-transform" aria-label="지우기">
              <X size={15} className="text-text-hint" />
            </button>
          )}
        </div>
      </div>

      {/* 결과 영역 — 하단 여백은 플로팅 BottomNav에 마지막 행이 가리지 않게 */}
      <div className="flex-1 overflow-y-auto pb-[130px]">
        {trimmed.length === 0 && (
          <p className="text-center text-[12px] text-text-hint font-medium pt-14">
            제휴 매장이나 교내시설 이름을 검색해보세요
          </p>
        )}

        {/* 교내시설 — 매장보다 먼저 (건물명을 찾는 의도가 더 분명한 검색어가 많다).
            결과가 없어도 실패·로딩 중이면 섹션을 띄워 그 사실을 알린다 */}
        {trimmed.length > 0 && (buildingResults.length > 0 || buildingsError || buildingsLoading) && (
          <div>
            <p className="px-4 pt-4 pb-1 text-[11px] font-extrabold text-text-hint">🏢 교내시설</p>
            <SectionStatus error={buildingsError} loading={buildingsLoading} />
            {buildingResults.map((building) => (
              <button
                key={building.id}
                onClick={() => onSelectBuilding(building)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left active:bg-slate-50 [-webkit-tap-highlight-color:transparent]"
              >
                <span className="text-xl flex-shrink-0">🏢</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[14px] font-extrabold text-text-main truncate">{building.name}</span>
                    {building.buildingNumber && (
                      <span className="text-[10px] font-bold text-text-hint flex-shrink-0">{building.buildingNumber}동</span>
                    )}
                  </div>
                  {/* 별칭으로 찾아온 사용자가 "이게 그거 맞나?"를 바로 확인할 수 있게 */}
                  {building.aliases.length > 0 && (
                    <p className="text-[11px] text-text-hint font-medium truncate mt-0.5">
                      {building.aliases.join(' · ')}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* 매장 쪽 실패·로딩 — 교내시설 결과는 그대로 두고 이 섹션에서만 알린다 */}
        {trimmed.length > 0 && (storesError || storesLoading) && (
          <div>
            <p className="px-4 pt-4 pb-1 text-[11px] font-extrabold text-text-hint">🏪 제휴 매장</p>
            <SectionStatus error={storesError} loading={storesLoading} />
          </div>
        )}

        {groups.map(({ category, stores }) => (
          <div key={category}>
            {/* 여러 카테고리에 걸치거나 교내시설과 섞일 때만 섹션 헤더 표시 */}
            {showSectionHeaders && (
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
            {reported ? (
              <p className="mt-4 text-[13px] font-extrabold text-emerald-600">제보가 접수됐어요, 고마워요! 🎉</p>
            ) : (
              <button
                onClick={handleReport}
                disabled={reporting}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#0E4A84] text-white text-[13px] font-bold active:scale-[0.96] transition-transform disabled:opacity-60"
              >
                <Send size={13} />
                {reporting ? '전송 중…' : `'${trimmed}' 제보하기`}
              </button>
            )}
            {/* 실패는 alert 대신 화면 안에서 알린다 — 재시도 버튼이 그대로 남아 있어야 하므로 */}
            {reportError && (
              <p className="mt-3 text-[12px] font-medium text-red-500">{reportError}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
