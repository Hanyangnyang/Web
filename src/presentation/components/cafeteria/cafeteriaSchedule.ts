// 순수 함수: 학식 메뉴를 끼니(type)별로 묶고, 표시 순서와 기본 펼침 상태를 결정
import type { MenuItemWithCafe } from './cafeteriaTypes.js';

const MEAL_ORDER = ['조식', '중식', '석식'];

// 메뉴를 끼니 타입(type)별로 그룹핑
export function groupMenusByType(menus: MenuItemWithCafe[]): Record<string, MenuItemWithCafe[]> {
  return menus.reduce<Record<string, MenuItemWithCafe[]>>((acc, m) => {
    if (!acc[m.type]) acc[m.type] = [];
    acc[m.type].push(m);
    return acc;
  }, {});
}

// 조식 → 중식 → 석식 순으로 그룹 정렬 (지나간 식사는 아래로 이동, 모든 식사가 지나갔으면 기본 순서 유지)
export function sortMealTypeEntries<T>(
  entries: [string, T][],
  date: Date,
  nowKst: Date
): [string, T][] {
  const allPast = entries.every(([type]) => isPastMealType(type, date, nowKst));

  return [...entries].sort(([a], [b]) => {
    if (!allPast) {
      const aPast = isPastMealType(a, date, nowKst);
      const bPast = isPastMealType(b, date, nowKst);
      if (!aPast && bPast) return -1;
      if (aPast && !bPast) return 1;
    }

    const ai = MEAL_ORDER.findIndex(k => a.includes(k));
    const bi = MEAL_ORDER.findIndex(k => b.includes(k));
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });
}

// 특정 끼니 타입이 현재 시각(KST) 및 선택된 날짜 기준으로 지나간 식사인지 판별
export function isPastMealType(type: string, date: Date, nowKst: Date): boolean {
  const dateStr = date.toISOString().split('T')[0];
  const todayStr = nowKst.toISOString().split('T')[0];

  if (dateStr < todayStr) return true;
  if (dateStr > todayStr) return false;

  // 오늘 날짜인 경우 KST 시각 기준 판별 (getUTCHours는 getKSTDate 시프트 적용 대상)
  const h = nowKst.getUTCHours();

  if (type.includes('조식') || type.includes('아침') || type.includes('천원')) {
    return h >= 9;
  }
  if (type.includes('중식') || type.includes('점심')) {
    return h >= 14;
  }
  if (type.includes('석식') || type.includes('저녁')) {
    return h >= 20;
  }

  return false;
}

// 특정 끼니 타입이 현재 시각(KST) 기준 주 제공 식사 시간대인지 판별
export function isActiveMealType(type: string, date: Date, nowKst: Date): boolean {
  const dateStr = date.toISOString().split('T')[0];
  const todayStr = nowKst.toISOString().split('T')[0];
  if (dateStr !== todayStr) return false;

  const h = nowKst.getUTCHours();
  if (h < 9) return type.includes('조식') || type.includes('아침') || type.includes('천원');
  if (h >= 14) return type.includes('석식') || type.includes('저녁');
  return type.includes('중식') || type.includes('점심');
}

export interface DefaultAccordionState {
  expandedGroups: Record<string, boolean>;
  // 오늘 날짜이고 시각에 해당되면 자동으로 스크롤할 끼니 타입, 아니면 null
  scrollTargetType: string | null;
}

// 딥링크(urlType) 없이 진입했을 때, 현재 시각(KST) 기준으로 어느 끼니를 기본으로 펼쳐둘지 결정
export function getDefaultAccordionState(
  menusWithCafe: MenuItemWithCafe[],
  date: Date,
  nowKst: Date
): DefaultAccordionState {
  const dateStr = date.toISOString().split('T')[0];
  const todayStr = nowKst.toISOString().split('T')[0];
  const isToday = dateStr === todayStr;

  const h = nowKst.getUTCHours();
  const targetType = h < 9 ? '조식' : h >= 14 ? '석식' : '중식';
  const hasTarget = menusWithCafe.some(m => m.type.includes(targetType));

  const getOpen = (type: string) => {
    if (!isToday || !hasTarget) return true;
    if (h < 9) return type.includes('조식') || type.includes('천원');
    if (h >= 14) return type.includes('석식');
    return type.includes('중식');
  };

  const expandedGroups: Record<string, boolean> = {};
  menusWithCafe.forEach(m => {
    if (expandedGroups[m.type] === undefined) expandedGroups[m.type] = getOpen(m.type);
  });

  const scrollTargetType = isToday ? targetType : null;

  return { expandedGroups, scrollTargetType };
}

