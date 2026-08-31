// 학식 탭 포맷팅 유틸: 날짜 라벨, 식사 아이콘, <b> 태그 파싱
import { getKSTDateUnsafe, toDateKey } from '../../../utils/kstTime.js';

export function formatDate(targetDate: Date): string {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const month = targetDate.getUTCMonth() + 1;
  const day = targetDate.getUTCDate();
  const base = `${month}월 ${day}일 (${days[targetDate.getUTCDay()]})`;

  const nowKst = getKSTDateUnsafe();
  const targetStr = toDateKey(targetDate);
  if (toDateKey(nowKst) === targetStr) return `${base} 오늘`;

  const tmr = new Date(nowKst.getTime() + 86400000);
  if (toDateKey(tmr) === targetStr) return `${base} 내일`;

  const yst = new Date(nowKst.getTime() - 86400000);
  if (toDateKey(yst) === targetStr) return `${base} 어제`;

  return base;
}

// 공유 시트용 짧은 날짜 라벨 (오늘/내일/어제/M월D일) — 기존엔 두 곳에서 각자 계산하던 걸 통합
export function getDateLabel(targetDate: Date): string {
  const nowKst = getKSTDateUnsafe();
  const targetStr = toDateKey(targetDate);
  if (targetStr === toDateKey(nowKst)) return '오늘';
  if (targetStr === toDateKey(new Date(nowKst.getTime() + 86400000))) return '내일';
  if (targetStr === toDateKey(new Date(nowKst.getTime() - 86400000))) return '어제';
  return `${targetDate.getUTCMonth() + 1}월 ${targetDate.getUTCDate()}일`;
}

const CHEONWON_MARKER = '천원의아침밥';

// "천원의 아침밥"처럼 띄어쓰기가 섞여 와도 매치되도록, 공백을 지우고 비교한다
export function isCheonwonMarker(item: string): boolean {
  return item.replace(/\s+/g, '').includes(CHEONWON_MARKER);
}

// 천원의아침밥 마커를 제외한 실제 메뉴 항목만 남긴다
export function filterRealMenuItems(menuItems: string[]): string[] {
  return menuItems.filter(item => !isCheonwonMarker(item));
}

// menuItems 중 대표(주) 메뉴 하나를 고른다 — 천원의아침밥 마커가 있으면 그다음 항목이 실제 주메뉴
export function getFeaturedItem(menuItems: string[]): string | null {
  return filterRealMenuItems(menuItems)[0] ?? null;
}

export function getMenuIcon(type: string): string {
  if (type.includes('조식')) return '☀️';
  if (type.includes('중식') || type.includes('일품') || type.includes('분식')) return '🍴';
  if (type.includes('석식')) return '🌙';
  if (type.includes('천원')) return '💰';
  return '🍚';
}

export function parseBoldText(text: string): React.ReactNode[] {
  const parts = text.split(/(<b>.*?<\/b>)/g);
  return parts.map((part, index) => {
    if (part.startsWith('<b>') && part.endsWith('</b>')) {
      const innerText = part.slice(3, -4);
      return <strong key={index} className="font-bold">{innerText}</strong>;
    }
    return part;
  });
}
