// 컴포넌트: 식사 타입(조식/중식/석식/천원 등) 하나의 아코디언
// "전체" 모드에서는 식당별로 한 번 더 접힌다 (식당별 미리보기 ↔ 상세 토글)
import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { getMenuIcon, filterRealMenuItems, parseBoldText, isCheonwonMarker } from './cafeteriaFormat.js';
import { MenuEntry } from './MenuEntry.js';
import { Accordion } from '../ui/Accordion.js';
import type { Cafe, CafeHours } from '../../../domain/entities/Cafe.js';
import type { MenuWithCafe, ShareTarget } from './cafeteriaTypes.js';

interface MealTypeAccordionProps {
  type: string;
  menus: MenuWithCafe[];
  isAllMode: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  hours?: CafeHours; // 단일 식당 모드에서 헤더 옆에 보여줄 운영시간
  cafes: Cafe[]; // "전체" 모드에서 식당별 운영시간 조회용
  targetStr: string; // YYYY-MM-DD (공유 URL 조립용)
  dateLabel: string; // 오늘/내일/어제/M월D일 (공유 시트 표시용)
  onShareRequest: (target: ShareTarget) => void;
}

interface CafeGroup {
  cafeId: string;
  cafeName: string;
  items: MenuWithCafe[];
}

function groupByCafe(menus: MenuWithCafe[]): CafeGroup[] {
  const map = new Map<string, CafeGroup>();
  menus.forEach(m => {
    if (!map.has(m.cafeId)) map.set(m.cafeId, { cafeId: m.cafeId, cafeName: m.cafeName, items: [] });
    map.get(m.cafeId)!.items.push(m);
  });
  return Array.from(map.values());
}

export function MealTypeAccordion({
  type, menus, isAllMode, isExpanded, onToggle, hours, cafes, targetStr, dateLabel, onShareRequest,
}: MealTypeAccordionProps) {
  // "전체" 모드에서 식당별 미리보기/상세 토글 상태 — 아코디언 인스턴스마다 로컬로 관리
  const [expandedCafeIds, setExpandedCafeIds] = useState<Record<string, boolean>>({});

  const mealKey = (['조식', '중식', '석식'] as const).find(k => type.includes(k));
  const hoursText = mealKey ? hours?.[mealKey] : null;

  const priceLabelFor = (menu: MenuWithCafe) => {
    if (!menu.price) return undefined;
    const isCheonwon = type.includes('천원') || menu.menuItems.some(isCheonwonMarker);
    return isCheonwon ? `${menu.price}💕` : menu.price;
  };

  const shareUrlFor = (cafeId: string) =>
    `${window.location.origin}/?date=${targetStr}&cafe=${cafeId}&type=${encodeURIComponent(type)}`;

  const cafeGroups = isAllMode ? groupByCafe(menus) : null;

  return (
    <Accordion
      isExpanded={isExpanded}
      onToggle={onToggle}
      dataType={type}
      style={{ scrollMarginTop: '140px' }}
      header={
        <>
          <span className="text-xl flex-shrink-0">{getMenuIcon(type)}</span>
          <span className="font-bold text-[16px] tracking-tight text-text-main flex-shrink-0">{type}</span>
          {hoursText && <span className="text-[12px] text-text-hint truncate">{hoursText}</span>}
        </>
      }
      extra={
        <span className="text-[10px] font-bold text-white bg-hyu-blue-light px-1.5 py-0.5 rounded-full">
          {menus.length}개 메뉴
        </span>
      }
    >
      {isAllMode && cafeGroups ? (
            <div className="text-left flex flex-col overflow-hidden w-full">
              {cafeGroups.map((group, groupIdx) => {
                const isCafeExpanded = !!expandedCafeIds[group.cafeId];
                const groupCafe = cafes.find(c => c.id === group.cafeId);
                const groupHoursText = mealKey ? groupCafe?.hours?.[mealKey] : null;

                return (
                  <div
                    key={group.cafeId}
                    className={`group pt-4 pb-4 px-5 flex flex-col gap-1.5 transition-colors duration-150 hover:bg-slate-50 cursor-pointer active:bg-slate-100 ${groupIdx > 0 ? 'border-t border-slate-100' : ''}`}
                    onClick={() => setExpandedCafeIds(prev => ({ ...prev, [group.cafeId]: !prev[group.cafeId] }))}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[15px] font-black text-primary flex-shrink-0">{group.cafeName}</span>
                        {groupHoursText && <span className="text-[11px] text-text-hint truncate">{groupHoursText}</span>}
                      </div>
                      <ChevronRight
                        size={16}
                        color="#94a3b8"
                        style={{ transform: isCafeExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}
                        className="flex-shrink-0"
                      />
                    </div>
                    <div className="flex flex-col">
                      {/* 접힌 상태: 메뉴를 한 줄 요약으로만 보여줌 */}
                      <div className={`cafe-accordion-content ${!isCafeExpanded ? 'expanded' : ''}`}>
                        <div className="accordion-inner">
                          <div className={`flex flex-col gap-2 pl-1 pr-1 transition-opacity duration-75 ${isCafeExpanded ? 'opacity-0' : 'opacity-100'}`}>
                            {group.items.map((item, idx) => {
                              const joinedMenu = filterRealMenuItems(item.menuItems)
                                .map((m, i) => (i === 0 ? `<b>${m}</b>` : m))
                                .join(', ');
                              return (
                                <div key={idx} className="flex items-baseline justify-between text-[14px] text-text-main gap-3">
                                  <div className="flex-1 min-w-0 font-normal text-left truncate">
                                    {parseBoldText(joinedMenu)}
                                  </div>
                                  {item.price && (
                                    <span className="flex-shrink-0 text-[14px] font-bold text-text-sub">{item.price}</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                      {/* 펼친 상태: 전체 상세 + 공유 버튼 */}
                      <div className={`cafe-accordion-content ${isCafeExpanded ? 'expanded' : ''}`}>
                        <div className="accordion-inner">
                          <div className={`flex flex-col pl-1 pr-1 transition-all duration-300 ${isCafeExpanded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
                            {group.items.map((item, idx) => (
                              <React.Fragment key={idx}>
                                {idx > 0 && <div className="my-3 border-b border-dashed border-slate-200" />}
                                <MenuEntry
                                  menu={item}
                                  priceLabel={priceLabelFor(item)}
                                  onShare={() => onShareRequest({
                                    type, menu: item, shareUrl: shareUrlFor(group.cafeId), dateLabel, cafeName: group.cafeName,
                                  })}
                                />
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            menus.map((m, i) => (
              <React.Fragment key={i}>
                {i > 0 && <div className="mx-5 border-b border-dashed border-slate-200" />}
                <div className="px-5 py-3.5 text-left relative">
                  <MenuEntry
                    menu={m}
                    priceLabel={priceLabelFor(m)}
                    onShare={() => onShareRequest({
                      type, menu: m, shareUrl: shareUrlFor(m.cafeId), dateLabel, cafeName: m.cafeName,
                    })}
                  />
                </div>
              </React.Fragment>
            ))
          )}
    </Accordion>
  );
}
