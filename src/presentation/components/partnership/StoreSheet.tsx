// 지도 하단 바텀시트
// - 매장 미선택: 현재 칩 기준 매장 리스트 (접힘 ↔ 펼침, 핸들 탭/스와이프)
// - 매장 선택: 혜택 상세 카드
import { useRef, type ReactNode } from 'react';
import { X, Info, Clock, ExternalLink, MapPin } from 'lucide-react';
import {
  activePartnerships, CATEGORY_META,
  COLLEGE_EMOJI, COLLEGE_STYLE, COLLEGE_DISPLAY_NAME,
  type PartnerStore,
} from './storeData';

interface Props {
  stores: PartnerStore[];          // 리스트에 표시할 매장들 (칩 필터 또는 클러스터 묶음)
  title: string;                   // 리스트 타이틀 (예: '제휴 매장' | '이 위치 제휴 매장')
  selected: PartnerStore | null;
  expanded: boolean;
  onToggleExpand: (expanded: boolean) => void;
  onSelect: (store: PartnerStore) => void;
  onClose: () => void;             // 상세 닫기 (선택 해제)
}

// 플로팅 BottomNav(반투명 블러)가 시트 위로 지나가도록 화면 끝까지 연장하고,
// 콘텐츠는 nav에 가리지 않게 하단 패딩(NAV_CLEARANCE)으로 비워둔다
const NAV_CLEARANCE = 'pb-[calc(108px+env(safe-area-inset-bottom,0px))]';

function SheetFrame({ heightClass, children }: { heightClass: string; children: ReactNode }) {
  return (
    <div
      className={`absolute bottom-0 inset-x-0 z-20 bg-white rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.15)] flex flex-col transition-[height] duration-300 ease-out ${heightClass}`}
    >
      {children}
    </div>
  );
}

export function StoreSheet({ stores, title, selected, expanded, onToggleExpand, onSelect, onClose }: Props) {
  const touchStartY = useRef<number | null>(null);

  // 핸들 스와이프로 접힘/펼침 전환
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current == null) return;
    const delta = touchStartY.current - e.changedTouches[0].clientY;
    if (delta > 30) onToggleExpand(true);
    else if (delta < -30) onToggleExpand(false);
    touchStartY.current = null;
  };

  // ── 상세 모드 ──
  if (selected) {
    const partnerships = activePartnerships(selected);
    const { latitude, longitude } = selected.location;
    // 카카오맵 place ID가 있으면 업체 상세 페이지로, 없으면(미등록 매장) 좌표 핀 지도로 폴백
    const kakaoMapUrl = selected.kakao_place_id
      ? `https://place.map.kakao.com/${selected.kakao_place_id}`
      : latitude != null && longitude != null
        ? `https://map.kakao.com/link/map/${encodeURIComponent(selected.name)},${latitude},${longitude}`
        : null;

    return (
      <SheetFrame heightClass="h-[60%]">
        {/* 헤더 */}
        <div className="flex items-start gap-3 px-4 pt-4 pb-3 border-b border-[#f1f5f9]">
          <span className="text-2xl flex-shrink-0 mt-0.5">{selected.emoji || CATEGORY_META[selected.category].emoji}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[16px] font-extrabold text-text-main truncate">{selected.name}</span>
              <span className="text-[11px] font-bold text-text-hint flex-shrink-0">{CATEGORY_META[selected.category].label}</span>
            </div>
            {selected.location.address && (
              <p className="flex items-center gap-1 text-[11px] text-text-hint font-medium mt-0.5 truncate">
                <MapPin size={10} className="flex-shrink-0" />
                {selected.location.address}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 [-webkit-tap-highlight-color:transparent] active:scale-90 transition-transform"
            aria-label="상세 닫기"
          >
            <X size={18} className="text-text-hint" />
          </button>
        </div>

        {/* 혜택 리스트 — key: 모드/매장 전환 시 스크롤 컨테이너를 리마운트해 scrollTop 잔존 방지 */}
        <div key={`detail-${selected.id}`} className={`flex-1 overflow-y-auto px-4 py-3 space-y-2.5 ${NAV_CLEARANCE}`}>
          {partnerships.length === 0 && (
            <p className="text-center text-[12px] text-text-hint font-medium pt-6">현재 진행 중인 제휴 혜택이 없어요</p>
          )}
          {partnerships.map((p, idx) => (
            <div key={`${p.college_id}-${idx}`} className="flex items-center gap-3 bg-surface rounded-xl p-4">
              <div className={`flex-shrink-0 w-[70px] flex flex-col items-center justify-center rounded-lg px-1.5 py-4 text-center gap-1 ${COLLEGE_STYLE[p.college_id] ?? 'bg-slate-100'}`}>
                <span className="text-[20px] leading-none">{COLLEGE_EMOJI[p.college_id]}</span>
                <span className="text-[11px] font-extrabold leading-tight break-words whitespace-pre-line">
                  {COLLEGE_DISPLAY_NAME[p.college_id] ?? p.college_name}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] text-text-main font-semibold leading-[1.65] whitespace-pre-line mb-1">{p.benefit}</p>
                {p.conditions && (
                  <div className="flex items-start gap-1 mt-1">
                    <Info size={10} className="text-text-hint mt-0.5 flex-shrink-0" />
                    <p className="text-[10px] text-text-hint leading-[1.5] font-medium">{p.conditions}</p>
                  </div>
                )}
                <div className="flex items-center justify-between gap-2 mt-1">
                  <div className="flex items-center gap-1">
                    <Clock size={10} className="text-text-hint flex-shrink-0" />
                    <span className="text-[10px] text-text-hint font-medium">
                      {p.period?.start_date?.slice(2).replace(/-/g, '.')} ~ {p.period?.end_date?.slice(2).replace(/-/g, '.')}
                    </span>
                  </div>
                  {p.source_url && (
                    <a
                      href={p.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-text-hint hover:underline"
                    >
                      <ExternalLink size={9} />
                      출처
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}

          {kakaoMapUrl && (
            <a
              href={kakaoMapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center text-[12px] font-bold text-[#0E4A84] py-2.5 rounded-xl border border-[#e2e8f0] active:bg-slate-50"
            >
              카카오맵에서 보기
            </a>
          )}
        </div>
      </SheetFrame>
    );
  }

  // ── 리스트 모드 ──
  return (
    <SheetFrame heightClass={expanded ? 'h-[64%]' : 'h-[calc(72px+96px+env(safe-area-inset-bottom,0px))]'}>
      {/* 핸들 + 타이틀 (탭/스와이프로 전환) */}
      <button
        className="flex flex-col items-center pt-2.5 pb-2 px-4 flex-shrink-0 [-webkit-tap-highlight-color:transparent]"
        onClick={() => onToggleExpand(!expanded)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        aria-label={expanded ? '리스트 접기' : '리스트 펼치기'}
      >
        <span className="w-9 h-1 rounded-full bg-slate-200" />
        <span className="mt-2 text-[13px] font-extrabold text-text-main">
          {title} <span className="text-[#0E4A84]">{stores.length}</span>곳
        </span>
      </button>

      {/* 매장 리스트 (펼침 시) — key: 상세 모드와 스크롤 컨테이너 재사용 방지 */}
      <div key="list" className={`flex-1 overflow-y-auto ${expanded ? NAV_CLEARANCE : ''}`}>
        {expanded && stores.map((store) => {
          const colleges = activePartnerships(store);
          return (
            <button
              key={store.id}
              onClick={() => onSelect(store)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left active:bg-slate-50 [-webkit-tap-highlight-color:transparent]"
            >
              <span className="text-xl flex-shrink-0">{store.emoji || CATEGORY_META[store.category].emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[14px] font-extrabold text-text-main truncate">{store.name}</span>
                  <span className="text-[10px] font-bold text-text-hint flex-shrink-0">{CATEGORY_META[store.category].label}</span>
                </div>
                {store.location.address && (
                  <p className="text-[11px] text-text-hint font-medium truncate mt-0.5">{store.location.address}</p>
                )}
              </div>
              {colleges.length > 0 && (
                <span className="flex-shrink-0 text-[10px] font-bold text-white bg-hyu-blue-light px-1.5 py-0.5 rounded-full">
                  {colleges.length === 1 ? colleges[0].college_name.replace(/\n/g, '') : `${colleges.length}개 단과대`}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </SheetFrame>
  );
}
