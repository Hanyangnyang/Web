// 학식 탭 포맷팅 유틸: 날짜 라벨, 식사 아이콘, <b> 태그 파싱
import { getKSTDate } from '../../../utils/time.js';

export function formatDate(targetDate: Date): string {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const month = targetDate.getUTCMonth() + 1;
  const day = targetDate.getUTCDate();
  const base = `${month}월 ${day}일 (${days[targetDate.getUTCDay()]})`;

  const nowKst = getKSTDate();
  const todayStr = nowKst.toISOString().split('T')[0];
  const targetStr = targetDate.toISOString().split('T')[0];
  if (todayStr === targetStr) return `${base} 오늘`;

  const tmr = new Date(nowKst.getTime() + 86400000);
  if (tmr.toISOString().split('T')[0] === targetStr) return `${base} 내일`;

  const yst = new Date(nowKst.getTime() - 86400000);
  if (yst.toISOString().split('T')[0] === targetStr) return `${base} 어제`;

  return base;
}

// 공유 시트용 짧은 날짜 라벨 (오늘/내일/어제/M월D일) — 기존엔 두 곳에서 각자 계산하던 걸 통합
export function getDateLabel(targetDate: Date): string {
  const nowKst = getKSTDate();
  const targetStr = targetDate.toISOString().split('T')[0];
  if (targetStr === nowKst.toISOString().split('T')[0]) return '오늘';
  if (targetStr === new Date(nowKst.getTime() + 86400000).toISOString().split('T')[0]) return '내일';
  if (targetStr === new Date(nowKst.getTime() - 86400000).toISOString().split('T')[0]) return '어제';
  return `${targetDate.getUTCMonth() + 1}월 ${targetDate.getUTCDate()}일`;
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
