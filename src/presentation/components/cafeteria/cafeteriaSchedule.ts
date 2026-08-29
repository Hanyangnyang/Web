// 순수 함수: 학식 메뉴를 끼니(type)별로 묶고, 표시 순서와 기본 펼침 상태를 결정
import { toDateKey } from '../../../utils/time.js';
import type { MenuWithCafe } from './cafeteriaTypes.js';

const MEAL_ORDER = ['조식', '중식', '석식'];

// 메뉴를 끼니 타입(type)별로 그룹핑
export function groupMenusByType(menus: MenuWithCafe[]): Record<string, MenuWithCafe[]> {
  return menus.reduce<Record<string, MenuWithCafe[]>>((acc, m) => {
    if (!acc[m.type]) acc[m.type] = [];
    acc[m.type].push(m);
    return acc;
  }, {});
}

// 조식 → 중식 → 석식 순으로 그룹 정렬 (그 외 타입은 뒤로)
export function sortMealTypeEntries<T>(entries: [string, T][]): [string, T][] {
  return [...entries].sort(([a], [b]) => {
    const ai = MEAL_ORDER.findIndex(k => a.includes(k));
    const bi = MEAL_ORDER.findIndex(k => b.includes(k));
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });
}

export interface DefaultAccordionState {
  expandedGroups: Record<string, boolean>;
  // 오늘 날짜이고 지금이 중식/석식 시간대라면 자동으로 스크롤할 끼니 타입, 아니면 null
  scrollTargetType: string | null;
}

// 딥링크(urlType) 없이 진입했을 때, 현재 시각(KST) 기준으로 어느 끼니를 기본으로 펼쳐둘지 결정
export function getDefaultAccordionState(
  menusWithCafe: MenuWithCafe[],
  date: Date,
  nowKst: Date
): DefaultAccordionState {
  const isToday = toDateKey(nowKst) === toDateKey(date);
  const h = nowKst.getUTCHours();
  const targetType = h < 9 ? '조식' : h >= 14 ? '석식' : '중식';
  const hasTarget = menusWithCafe.some(m => m.type.includes(targetType));

  const getOpen = (type: string) => {
    if (!isToday || !hasTarget) return true;
    if (h < 9) return type.includes('조식');
    if (h >= 14) return type.includes('석식');
    return !type.includes('조식') && !type.includes('석식');
  };

  const expandedGroups: Record<string, boolean> = {};
  menusWithCafe.forEach(m => {
    if (expandedGroups[m.type] === undefined) expandedGroups[m.type] = getOpen(m.type);
  });

  const scrollTargetType = isToday && (targetType === '중식' || targetType === '석식') ? targetType : null;

  return { expandedGroups, scrollTargetType };
}
