// 지도 하단 바텀시트: 교내시설 — 지금 화면에 보이는 건물 리스트(+거리) / 개별 건물 상세
import { X } from 'lucide-react';
import type { CampusBuilding } from '../../../domain/entities/CampusBuilding.js';
import type { LatLng } from '../../../lib/geo.js';
import { StandardBottomSheet } from '../ui/StandardBottomSheet.js';
import { collegeStyleByName } from '../ui/collegeStyle.js';
import { collegeByName } from '../../../domain/entities/College.js';
import { BUILDING_DETAIL_MAX_FRACTION, BUILDING_LIST_FRACTION, NAV_CLEARANCE_CLASS, toCssHeight } from './sheetHeights';
import { NearbyListSheet } from './NearbyListSheet';

export type BuildingSheetVariant = 'facility' | 'openspace';

interface Props {
  buildings: CampusBuilding[];
  loading: boolean;
  error: string | null;
  origin: LatLng | null; // 거리 계산 기준점 (내 위치 또는 화면 중심)
  variant: BuildingSheetVariant;
  selected: CampusBuilding | null;
  onSelect: (building: CampusBuilding) => void;
  onClose: () => void;                       // 상세 닫기 → 목록으로 복귀
}


// 조사(이/가) 때문에 빈 목록 문구는 조립하지 않고 통째로 둔다
const VARIANT_META: Record<BuildingSheetVariant, { title: string; emoji: string; empty: string }> = {
  facility: {
    title: '교내시설',
    emoji: '🏢',
    empty: '표시할 교내시설이 없어요',
  },
  openspace: {
    title: '오픈스페이스',
    emoji: '📚',
    empty: '표시할 오픈스페이스가 없어요',
  },
};

export function CampusBuildingSheet({ buildings, loading, error, origin, variant, selected, onSelect, onClose }: Props) {
  const meta = VARIANT_META[variant];

  // ── 상세 모드 ──
  if (selected) {
    const hasDetails = !!selected.description
      || selected.primaryColleges.length > 0
      || selected.facilities.length > 0
      || selected.openSpaces.length > 0;

    return (
      <StandardBottomSheet height="auto" maxHeight={toCssHeight(BUILDING_DETAIL_MAX_FRACTION)}>
        <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-[#f1f5f9]">
          <span className="text-2xl flex-shrink-0">{meta.emoji}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[16px] font-extrabold text-text-main truncate">{selected.name}</span>
              {selected.buildingNumber && (
                <span className="text-[11px] font-bold text-text-hint flex-shrink-0">{selected.buildingNumber}동</span>
              )}
            </div>
            {selected.englishName && (
              <p className="text-[11px] text-text-hint font-medium truncate">{selected.englishName}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 [-webkit-tap-highlight-color:transparent] active:scale-90 transition-transform"
            aria-label="목록으로"
          >
            <X size={18} className="text-text-hint" />
          </button>
        </div>

        <div className={`flex-1 min-h-0 overflow-y-auto px-4 ${hasDetails ? 'py-3 space-y-3' : ''} ${NAV_CLEARANCE_CLASS}`}>
          {selected.description && (
            <p className="text-[12px] text-text-main font-medium leading-[1.6]">{selected.description}</p>
          )}

          {selected.primaryColleges.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-text-hint mb-1.5">주요 단과대</p>
              <div className="flex flex-wrap gap-1.5">
                {/* 제휴 매장 시트와 같은 단과대 색·이모지를 쓴다 — 같은 과가 화면이 달라도 같게 보이도록.
                    대학본부·학군단처럼 단과대가 아닌 값은 이모지 없이 중립색 칩으로 나온다. */}
                {selected.primaryColleges.map((college) => {
                  const emoji = collegeByName(college)?.emoji;
                  return (
                    <span key={college} className={`px-2 py-1 rounded-full text-[11px] font-semibold ${collegeStyleByName(college)}`}>
                      {emoji ? `${emoji} ${college}` : college}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {selected.facilities.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-text-hint mb-1.5">편의시설</p>
              <div className="flex flex-wrap gap-1.5">
                {selected.facilities.map((facility) => (
                  <span key={facility} className="px-2 py-1 rounded-full bg-surface text-[11px] font-semibold text-text-main">
                    {facility}
                  </span>
                ))}
              </div>
            </div>
          )}

          {selected.openSpaces.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-text-hint mb-1.5">오픈스페이스</p>
              <ul className="space-y-1">
                {selected.openSpaces.map((space) => (
                  <li key={space} className="text-[11px] text-text-main font-medium">· {space}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </StandardBottomSheet>
    );
  }

  // ── 목록 모드: 전체를 가까운 순으로 나열 (껍데기는 NearbyListSheet가, 행 내용만 여기서) ──
  return (
    <NearbyListSheet
      items={buildings}
      loading={loading}
      error={error}
      origin={origin}
      height={toCssHeight(BUILDING_LIST_FRACTION)}
      emoji={meta.emoji}
      title={meta.title}
      countColorClass="text-[#D97706]"
      emptyText={meta.empty}
      onSelect={onSelect}
      renderLabel={(b) => (
        <>
          <span className="block text-[14px] font-extrabold text-text-main truncate">{b.name}</span>
          {/* 오픈스페이스 모드에선 들어가기 전에 어떤 공간인지 목록에서 바로 보이게 한다 */}
          {variant === 'openspace' && (
            <span className="block text-[11px] text-text-hint font-medium truncate mt-0.5">
              {b.openSpaces.join(' · ')}
            </span>
          )}
        </>
      )}
    />
  );
}
