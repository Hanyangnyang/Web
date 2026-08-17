// 지도 하단 바텀시트
// - 매장 미선택: 현재 칩 기준 매장 리스트 (접힘 ↔ 펼침, 핸들 탭/스와이프)
// - 매장 선택: 혜택 상세 카드
import { useCallback, useEffect, useRef } from 'react';
import { X, Info, Clock, ExternalLink, ChevronRight } from 'lucide-react';
import { activePartnerships, CATEGORY_META, type PartnerStore } from '../../../../domain/entities/PartnerStore.js';
import { COLLEGES, collegeById, collegeLabel } from '../../../../domain/entities/College.js';
import { COLLEGE_STYLE } from '../../ui/collegeStyle.js';
import { CollegeWheelPicker } from '../../ui/CollegeWheelPicker';
import { StandardBottomSheet } from '../../ui/StandardBottomSheet.js';
import { SheetHandle } from './SheetHandle';
import {
  STORE_DETAIL_FRACTION, STORE_LIST_EXPANDED_FRACTION, LIST_COLLAPSED_CSS,
  NAV_CLEARANCE_CLASS, toCssHeight,
} from './sheetMetrics';

// 휠피커 옵션 — '전체' 항목 + 단과대 목록. 컴포넌트 바깥에 둬 매 렌더마다 새 배열이 생기지 않게 한다.
const COLLEGE_OPTIONS = [
  { id: 'all', label: '전체 단과대' },
  ...COLLEGES.map((c) => ({ id: c.id, label: c.name })),
];

interface Props {
  stores: PartnerStore[];          // 리스트에 표시할 매장들 (칩 필터 또는 클러스터 묶음)
  // 매장 데이터의 로딩·실패는 지도를 막지 않고 여기서만 알린다 (교내시설·흡연장 시트와 같은 방식).
  // 실패해도 지도와 다른 레이어는 계속 쓸 수 있어야 하므로.
  loading: boolean;
  error: string | null;
  title: string;                   // 리스트 타이틀 (예: '제휴 식당' | '이 위치 제휴 매장')
  college: string;                 // 단과대 필터 ('all' | collegeId)
  onCollegeChange: (id: string) => void;
  resetSignal: string;             // 값이 바뀌면 리스트 스크롤을 맨 위로 (칩·단과대 변경 시)
  selected: PartnerStore | null;
  expanded: boolean;
  onToggleExpand: (expanded: boolean) => void;
  onSelect: (store: PartnerStore) => void;
  onClose: () => void;             // 상세 닫기 (선택 해제)
}

export function StoreSheet({ stores, loading, error, title, college, onCollegeChange, resetSignal, selected, expanded, onToggleExpand, onSelect, onClose }: Props) {
  // 목록 스크롤 위치 보존: 상세 진입 시 리마운트(key)로 컨테이너가 사라지므로
  // 스크롤 값을 ref에 기록해뒀다가, 목록이 다시 마운트될 때 복원한다 (X 복귀 시 이어보기)
  const listScrollTop = useRef(0);
  const listEl = useRef<HTMLDivElement | null>(null);
  const attachListRef = useCallback((el: HTMLDivElement | null) => {
    listEl.current = el;
    if (el) el.scrollTop = listScrollTop.current;
  }, []);

  // 칩·단과대 필터가 바뀌면 목록은 새 컨텍스트 → 스크롤 맨 위로
  useEffect(() => {
    listScrollTop.current = 0;
    if (listEl.current) listEl.current.scrollTop = 0;
  }, [resetSignal]);

  // ── 상세 모드 ──
  if (selected) {
    // 단과대 필터가 걸려 있으면 해당 단과대 혜택만 표시
    const allPartnerships = activePartnerships(selected);
    const partnerships = college === 'all'
      ? allPartnerships
      : allPartnerships.filter((p) => p.collegeId === college);
    const coords = selected.location.coordinates;
    // 카카오맵 place ID가 있으면 업체 상세 페이지로, 없으면(미등록 매장) 좌표 핀 지도로 폴백
    const kakaoMapUrl = selected.kakaoPlaceId
      ? `https://place.map.kakao.com/${selected.kakaoPlaceId}`
      : coords
        ? `https://map.kakao.com/link/map/${encodeURIComponent(selected.name)},${coords.latitude},${coords.longitude}`
        : null;

    return (
      // 단과대 카드 1개 + 다음 카드 절반쯤 보이는 높이 — 지도가 주인공으로 남는다
      <StandardBottomSheet height={toCssHeight(STORE_DETAIL_FRACTION)}>
        {/* 헤더 */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-[#f1f5f9]">
          <span className="text-2xl flex-shrink-0">{selected.emoji || CATEGORY_META[selected.category].emoji}</span>
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[16px] font-extrabold text-text-main truncate">{selected.name}</span>
              <span className="text-[11px] font-bold text-text-hint flex-shrink-0">{CATEGORY_META[selected.category].label}</span>
            </div>
            {kakaoMapUrl && (
              <a
                href={kakaoMapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto flex-shrink-0 inline-flex items-center gap-1 text-[11px] font-bold text-[#3C1E1E] bg-[#FEE500]/25 rounded-lg px-2 py-1.5 active:bg-[#FEE500]/40 transition-colors [-webkit-tap-highlight-color:transparent]"
              >
                카카오맵
                <ExternalLink size={11} />
              </a>
            )}
          </div>
          <CollegeWheelPicker
            options={COLLEGE_OPTIONS}
            value={college}
            onChange={onCollegeChange}
            triggerClassName="flex-shrink-0 flex items-center gap-1 max-w-[110px] text-[11px] font-bold text-text-main bg-surface border border-[#e2e8f0] rounded-lg pl-2 pr-1.5 py-1.5"
          />
          <button
            onClick={onClose}
            className="p-1 [-webkit-tap-highlight-color:transparent] active:scale-90 transition-transform"
            aria-label="상세 닫기"
          >
            <X size={18} className="text-text-hint" />
          </button>
        </div>

        {/* 혜택 리스트 — key: 모드/매장 전환 시 스크롤 컨테이너를 리마운트해 scrollTop 잔존 방지 */}
        <div key={`detail-${selected.id}`} className={`flex-1 overflow-y-auto px-4 py-3 space-y-2.5 ${NAV_CLEARANCE_CLASS}`}>
          {partnerships.length === 0 && (
            <p className="text-center text-[12px] text-text-hint font-medium pt-6">
              {college !== 'all' && allPartnerships.length > 0
                ? '선택한 단과대의 제휴 혜택이 없어요'
                : '현재 진행 중인 제휴 혜택이 없어요'}
            </p>
          )}
          {partnerships.map((p, idx) => (
            <div key={`${p.collegeId}-${idx}`} className="flex items-center gap-3 bg-surface rounded-xl p-4">
              <div className={`flex-shrink-0 w-[70px] flex flex-col items-center justify-center rounded-lg px-1.5 py-4 text-center gap-1 ${COLLEGE_STYLE[p.collegeId] ?? 'bg-slate-100'}`}>
                <span className="text-[20px] leading-none">{collegeById(p.collegeId)?.emoji}</span>
                <span className="text-[11px] font-extrabold leading-tight break-words whitespace-pre-line">
                  {collegeLabel(p.collegeId, p.collegeName)}
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
                      {p.period?.startDate?.slice(2).replace(/-/g, '.')} ~ {p.period?.endDate?.slice(2).replace(/-/g, '.')}
                    </span>
                  </div>
                  {p.sourceUrl && (
                    <a
                      href={p.sourceUrl}
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
        </div>
      </StandardBottomSheet>
    );
  }

  // ── 리스트 모드 ──
  return (
    <StandardBottomSheet height={expanded ? toCssHeight(STORE_LIST_EXPANDED_FRACTION) : LIST_COLLAPSED_CSS}>
      {/* 핸들 + 타이틀(좌) + 단과대 드롭다운(우) */}
      <SheetHandle expanded={expanded} onToggleExpand={onToggleExpand}>
        <div className="flex items-center justify-between gap-2">
          <button
            className="text-left text-[13px] font-extrabold text-text-main [-webkit-tap-highlight-color:transparent]"
            onClick={() => onToggleExpand(!expanded)}
          >
            {title} <span className="text-[#0E4A84]">{stores.length}</span>곳
          </button>
          <CollegeWheelPicker
            options={COLLEGE_OPTIONS}
            value={college}
            onChange={onCollegeChange}
            onOpen={() => onToggleExpand(true)}
            triggerClassName="flex-shrink-0 flex items-center gap-1 max-w-[150px] text-[11px] font-bold text-text-main bg-surface border border-[#e2e8f0] rounded-lg pl-2 pr-1.5 py-1.5"
          />
        </div>
      </SheetHandle>

      {/* 매장 리스트 — key: 상세 모드와 스크롤 컨테이너 재사용 방지.
          접혀 있어도 그대로 그린다. 예전엔 expanded일 때만 그렸는데, 그러면 접힌 시트 안이
          하얗게 비어 무엇을 펼치는 건지 알 수 없었다. 지금은 시트 높이가 첫 카드를 잘라 보여준다
          (교내시설·흡연장 시트와 같은 방식) */}
      <div
        key="list"
        ref={attachListRef}
        onScroll={(e) => { listScrollTop.current = e.currentTarget.scrollTop; }}
        className={`flex-1 overflow-y-auto ${NAV_CLEARANCE_CLASS}`}
      >
        {/* 실패·로딩·빈 목록은 서로 다른 상황이라 문구를 구분한다 (NearbyListSheet와 같은 규칙) */}
        {error ? (
          <p className="text-center text-[12px] text-red-500 font-medium pt-6">{error}</p>
        ) : loading ? (
          <p className="text-center text-[12px] text-text-hint font-medium pt-6 animate-pulse">불러오는 중…</p>
        ) : stores.length === 0 ? (
          <p className="text-center text-[12px] text-text-hint font-medium pt-6">표시할 매장이 없어요</p>
        ) : null}

        {stores.map((store, idx) => {
          const colleges = activePartnerships(store);
          // 단과대 필터가 걸려 있으면 이미 그 단과대 제휴로 좁혀진 목록이라
          // 전체 단과대 수 배지는 정보가 아니라 혼동을 준다 — '전체'일 때만 표시
          const showCollegeBadge = college === 'all' && colleges.length > 0;
          return (
            <button
              key={store.id}
              onClick={() => onSelect(store)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left active:bg-slate-50 [-webkit-tap-highlight-color:transparent] ${
                idx > 0 ? 'border-t border-[#f1f5f9]' : ''
              }`}
            >
              <span className="text-xl flex-shrink-0">{store.emoji || CATEGORY_META[store.category].emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[14px] font-extrabold text-text-main truncate">{store.name}</span>
                  <span className="text-[10px] font-bold text-text-hint flex-shrink-0">{CATEGORY_META[store.category].label}</span>
                </div>
                {/* 주소 대신 혜택 요약 — 리스트에서 바로 "뭘 주는지"가 보이게 */}
                {(store.summaryBenefit || store.location.address) && (
                  <p className="text-[11px] text-text-hint font-medium truncate mt-0.5">
                    {store.summaryBenefit ?? store.location.address}
                  </p>
                )}
              </div>
              {showCollegeBadge && (
                <span className="flex-shrink-0 text-[10px] font-bold text-white bg-hyu-blue-light px-1.5 py-0.5 rounded-full">
                  {colleges.length === 1 ? colleges[0].collegeName.replace(/\n/g, '') : `${colleges.length}개 단과대`}
                </span>
              )}
              <ChevronRight size={16} className="flex-shrink-0 text-text-hint" />
            </button>
          );
        })}
      </div>
    </StandardBottomSheet>
  );
}
