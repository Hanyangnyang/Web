// 컴포넌트: 날짜·식당 선택 및 아코디언 학식 목록 표시 (컨테이너 — state·effect·레이아웃만 담당)
import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Bell } from 'lucide-react';
import { usePostHog } from 'posthog-js/react';
import { getKSTDateUnsafe, toDateKey } from '../../../utils/time.js';
import { scrollNearestScrollableAncestorToTop } from '../../../utils/scroll.js';
import { ErrorBoundary } from '../common/ErrorBoundary.js';
import { CardFallback } from '../common/CardFallback.js';
import { DateNavigator } from './DateNavigator.js';
import { CafeChipSelector } from './CafeChipSelector.js';
import { MealTypeAccordion } from './MealTypeAccordion.js';
import { getDateLabel, getFeaturedItem } from './cafeteriaFormat.js';
import { groupMenusByType, sortMealTypeEntries, getDefaultAccordionState } from './cafeteriaSchedule.js';
import type { Cafe, CafeHours } from '../../../domain/entities/Cafe.js';
import type { MenuWithCafe, ShareTarget } from './cafeteriaTypes.js';

const CafeteriaAlarmSettings = lazy(() => import('./CafeteriaAlarmSettings.js').then(m => ({ default: m.CafeteriaAlarmSettings })));
const ShareSheet = lazy(() => import('./ShareSheet.js').then(m => ({ default: m.ShareSheet })));

interface CafeDeepLink {
  date: string | null;
  cafe: string | null;
  type: string | null;
}

interface CafeteriaViewProps {
  date: Date;
  changeDate: (offsetOrDate: number | Date) => void;
  cafes: Cafe[];
  loading: boolean;
  revalidating: boolean;
  cafeDeepLink: CafeDeepLink | null;
  onCafeDeepLinkHandled?: () => void;
}

export function CafeteriaView({ date, changeDate, cafes, loading, revalidating, cafeDeepLink, onCafeDeepLinkHandled }: CafeteriaViewProps) {
  const urlParams = new URLSearchParams(window.location.search);
  const urlTypeRef = useRef(urlParams.get('type'));
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const [selectedCafeId, setSelectedCafeId] = useState(() => urlParams.get('cafe') || 'all');

  const foundCafe = cafes.find(c => c.id === selectedCafeId);
  const selectedCafeName = selectedCafeId === 'all' ? '전체' : (foundCafe?.name ?? selectedCafeId);
  const selectedCafeHours: CafeHours = selectedCafeId === 'all' ? {} : (foundCafe?.hours ?? {});

  // "전체"/단일 식당 모드 구분 없이 MealTypeAccordion이 동일한 모양을 다루도록 cafeName/cafeId를 항상 붙인다
  const menusWithCafe: MenuWithCafe[] = selectedCafeId === 'all'
    ? cafes.reduce<MenuWithCafe[]>((acc, c) => {
        if (!c.available || !c.menus.length) return acc;
        return acc.concat(c.menus.map(m => ({ ...m, cafeName: c.name, cafeId: c.id })));
      }, [])
    : (foundCafe?.menus ?? []).map(m => ({ ...m, cafeName: selectedCafeName, cafeId: selectedCafeId }));

  const posthog = usePostHog();

  const handleCafeSelect = (id: string) => {
    const cafeName = id === 'all' ? '전체' : (cafes.find(c => c.id === id)?.name || id);
    posthog?.capture('cafeteria_chip_clicked', { cafeId: id, cafeName });
    setSelectedCafeId(id);
    scrollNearestScrollableAncestorToTop(rootRef.current);
  };

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [deepLinkTrigger, setDeepLinkTrigger] = useState(0);
  const [showAlarm, setShowAlarm] = useState(false);
  const [shareTarget, setShareTarget] = useState<ShareTarget | null>(null);
  const [copiedToast, setCopiedToast] = useState(false);
  const [alarmPopup, setAlarmPopup] = useState('');

  // 식당 자동 선택 및 메뉴 유무 확인
  useEffect(() => {
    if (!cafes.length) return;
    if (selectedCafeId === 'all') return;
    const current = cafes.find(c => c.id === selectedCafeId);
    if (!current?.menus?.length) {
      const fallback = cafes.find(c => c.menus?.length > 0);
      if (fallback) setSelectedCafeId(fallback.id);
    }
  }, [cafes, selectedCafeId]); // eslint-disable-line react-hooks/exhaustive-deps

  // 딥링크 처리: 날짜 동기화
  useEffect(() => {
    const urlDate = urlParams.get('date');
    if (urlDate) {
      const parsed = new Date(urlDate);
      if (!isNaN(parsed.getTime()) && urlDate !== toDateKey(date)) {
        changeDate(parsed);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 딥링크 처리: 파라미터 제거 (모든 연동 준비 후)
  useEffect(() => {
    if (window.location.search) {
      const t = setTimeout(() => {
        window.history.replaceState({}, '', window.location.pathname);
      }, 1000); // 넉넉히 1초 후 제거
      return () => clearTimeout(t);
    }
  }, []);

  // 네이티브 알림 탭 딥링크: App에서 전달된 파라미터 처리
  useEffect(() => {
    if (!cafeDeepLink) return;
    const { date: dateStr, cafe: cafeId, type: mealType } = cafeDeepLink;
    if (dateStr) {
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) changeDate(parsed);
    }
    if (cafeId) {
      setSelectedCafeId(cafeId);
    }
    if (mealType) {
      urlTypeRef.current = mealType;
    }
    setDeepLinkTrigger(t => t + 1);
    onCafeDeepLinkHandled?.();
  }, [cafeDeepLink]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!menusWithCafe.length) return;

    const urlType = urlTypeRef.current;
    if (urlType) {
      const initial: Record<string, boolean> = {};
      let foundExact = false;

      menusWithCafe.forEach(m => {
        // 정확히 일치하거나, 포함되어 있는 경우 (예: "중식" vs "중식 (학식)")
        const match = m.type === urlType || m.type.includes(urlType) || urlType.includes(m.type);
        if (initial[m.type] === undefined) {
          initial[m.type] = match;
          if (match) foundExact = true;
        }
      });

      setExpandedGroups(initial);
      urlTypeRef.current = null;

      if (foundExact) {
        setTimeout(() => {
          // 정확히 일치하는 data-type을 찾거나, 포함하는 요소를 찾음
          const targetEl = listRef.current?.querySelector(`[data-type="${CSS.escape(urlType)}"]`) ||
                          listRef.current?.querySelector(`[data-type*="${urlType}"]`);
          if (targetEl) {
            // scrollIntoView로 실제 스크롤 컨테이너(overflow-y-auto div)를 스크롤
            targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 300);
      }
      return;
    }

    const { expandedGroups: initial, scrollTargetType } = getDefaultAccordionState(menusWithCafe, date, getKSTDateUnsafe());
    setExpandedGroups(initial);

    if (scrollTargetType) {
      setTimeout(() => {
        const targetEl = listRef.current?.querySelector(`[data-type*="${scrollTargetType}"]`);
        if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    }
  }, [selectedCafeId, cafes, date, deepLinkTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleGroup = (type: string) =>
    setExpandedGroups(prev => ({ ...prev, [type]: !prev[type] }));

  const groupedMenus = groupMenusByType(menusWithCafe);

  const handleCopied = () => {
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2000);
  };

  return (
    <div ref={rootRef} className="pb-28 relative">
      <button
        className="fixed bottom-[calc(20px+64px+12px+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 h-10 px-3 bg-[rgba(15,23,42,0.72)] backdrop-blur-[20px] text-surface border border-white/10 rounded-full flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.35)] z-[999] whitespace-nowrap text-[0.78rem] font-medium font-[inherit] transition-all duration-200 hover:scale-[1.04] hover:bg-[rgba(15,23,42,0.88)] hover:shadow-[0_6px_28px_rgba(0,0,0,0.45)] active:scale-[0.97]"
        onClick={() => setShowAlarm(true)}
      >
        <Bell size={18} />
        학식 알림 받기
      </button>
      {showAlarm && (
        <Suspense fallback={null}>
          <CafeteriaAlarmSettings onClose={(msg?: string) => {
            setShowAlarm(false);
            if (msg) {
              setAlarmPopup(msg);
              setTimeout(() => setAlarmPopup(''), 1500);
            }
          }} />
        </Suspense>
      )}
      {shareTarget && (
        <Suspense fallback={null}>
          <ShareSheet
            cafeName={shareTarget.cafeName}
            mealType={shareTarget.type}
            featuredItem={getFeaturedItem(shareTarget.menu.menuItems)}
            dateLabel={shareTarget.dateLabel}
            shareUrl={shareTarget.shareUrl}
            onClose={() => setShareTarget(null)}
            onCopied={handleCopied}
          />
        </Suspense>
      )}
      {copiedToast && (
        <div className="copy-toast fixed bottom-[calc(20px+64px+52px+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 bg-[rgba(15,23,42,0.88)] text-white text-[0.78rem] font-semibold px-4 py-2 rounded-full whitespace-nowrap z-[2000] pointer-events-none">
          링크 복사됨!
        </div>
      )}
      {alarmPopup && (
        <div className="fixed bottom-[calc(20px+64px+60px+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 bg-[rgba(15,23,42,0.85)] text-white text-[0.78rem] font-medium px-4 py-2 rounded-full z-[1000] whitespace-pre-line text-center copy-toast">
          {alarmPopup}
        </div>
      )}

      {/* 고정 헤더: 날짜 및 식당 선택 */}
      <div className="sticky top-0 z-[100] bg-surface/90 backdrop-blur-xl pt-4 pb-4 -mx-4 px-4 mb-2.5 rounded-b-xl border-b border-slate-200/50 shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
        <DateNavigator date={date} loading={loading} onPrev={() => changeDate(-1)} onNext={() => changeDate(1)} />
        <CafeChipSelector cafes={cafes} selectedCafeId={selectedCafeId} loading={loading} onSelect={handleCafeSelect} />
      </div>

      {/* 메뉴 목록 */}
      <ErrorBoundary name="cafeteria-list" fallback={<CardFallback message="학식 정보를 표시할 수 없습니다" />}>
        <div ref={listRef} style={{ position: 'relative', minHeight: '200px' }}>
          {revalidating && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)', zIndex: 10, borderRadius: 'var(--radius-card)', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: '1rem' }}>
              <div className="w-10 h-10 border-[3px] border-white/10 rounded-full border-t-primary animate-[spin_0.8s_linear_infinite] mb-4" />
              <span style={{ fontSize: '0.85rem', color: 'white', fontWeight: '600' }}>학식 정보를 가져오는 중...</span>
            </div>
          )}

          <div style={{ filter: revalidating ? 'blur(2px)' : 'none', transition: 'filter 0.3s ease' }}>
            {/* 1. 첫 로딩 — 스피너 */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-10 h-10 border-[3px] border-slate-200 rounded-full border-t-primary animate-[spin_0.8s_linear_infinite]" />
                <span className="text-xs font-semibold text-text-sub">학식 정보를 가져오는 중...</span>
              </div>
            ) : cafes.length > 0 ? (
              Object.keys(groupedMenus).length > 0 ? (
                // 4. 정상 — 그날 등록된 메뉴가 하나라도 있음
                sortMealTypeEntries(Object.entries(groupedMenus))
                  .map(([type, menus]) => (
                    <MealTypeAccordion
                      key={type}
                      type={type}
                      menus={menus}
                      isAllMode={selectedCafeId === 'all'}
                      isExpanded={!!expandedGroups[type]}
                      onToggle={() => toggleGroup(type)}
                      hours={selectedCafeHours}
                      cafes={cafes}
                      targetStr={toDateKey(date)}
                      dateLabel={getDateLabel(date)}
                      onShareRequest={setShareTarget}
                    />
                  ))
              ) : (
                // 3. 조회는 됐지만 빈 데이터 — 실패는 아니고 그날 등록된 메뉴가 하나도 없음
                <div className="bg-white border border-slate-200 rounded-card overflow-hidden shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05),0_2px_4px_-1px_rgba(0,0,0,0.03)]">
                  <div className="min-h-[425px] flex flex-col justify-center py-8 text-center text-text-sub font-semibold">
                    <p>해당 식당은 오늘 등록된 메뉴가 없습니다</p>
                  </div>
                </div>
              )
            ) : (
              // 2. 조회 실패 — KNOWN_CAFES 병합 덕에 성공이면 cafes가 항상 4개라, 여긴 진짜 실패일 때만 옴
              <div className="bg-white border border-slate-200 rounded-card overflow-hidden shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05),0_2px_4px_-1px_rgba(0,0,0,0.03)]">
                <div className="min-h-[425px] flex flex-col justify-center py-8 text-center text-text-sub font-semibold">
                  <p>정보를 불러올 수 없습니다</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </ErrorBoundary>
    </div>
  );
}
