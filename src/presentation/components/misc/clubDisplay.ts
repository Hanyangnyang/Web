// 유틸: 동아리 카테고리별 색상, 활동 종류별 이모지 — ClubView·ClubSpotlightCard 공용
import { type ClubCategory } from '../../../domain/entities/Club.js';

export const categoryStyles: Record<ClubCategory, { icon: string }> = {
  예술: { icon: 'bg-violet-50 text-violet-600' },
  체육: { icon: 'bg-emerald-50 text-emerald-600' },
  학술교양: { icon: 'bg-blue-50 text-blue-600' },
  봉사: { icon: 'bg-rose-50 text-rose-600' },
  종교: { icon: 'bg-amber-50 text-amber-600' },
};

export const categoryEmoji: Record<ClubCategory, string> = {
  예술: '🎨',
  체육: '🏅',
  학술교양: '📚',
  봉사: '🤝',
  종교: '✝️',
};

export const getActivityEmoji = (activityType: string) => {
  const emojiByActivity: Array<[string, string]> = [
    ['밴드', '🎸'], ['농구', '🏀'], ['영화', '🎬'], ['공모전', '🏆'], ['칵테일', '🍸'],
    ['만화', '🎨'], ['뮤지컬', '🎭'], ['e스포츠', '🎮'], ['힙합', '🕺'], ['기독교', '✝️'],
    ['국악', '🥁'], ['볼링', '🎳'], ['댄스', '💃'], ['연극', '🎭'], ['축구', '⚽'],
    ['야구', '⚾'], ['유학', '🌏'], ['러닝', '🏃'], ['코딩', '💻'], ['봉사', '🤝'],
    ['천문', '🔭'], ['창작극', '🎭'], ['피아노', '🎹'], ['배드민턴', '🏸'], ['합창', '🎶'],
    ['토론', '💬'], ['클라이밍', '🧗'], ['자전거', '🚲'], ['스쿠버', '🤿'], ['기타', '🎼'],
    ['보드', '🎲'], ['독서', '📚'], ['테니스', '🎾'], ['탁구', '🏓'], ['흑인음악', '🎤'],
    ['요트', '⛵'], ['사진', '📷'], ['패션', '👗'], ['성경', '📖'],
  ];
  return emojiByActivity.find(([keyword]) => activityType.includes(keyword))?.[1] ?? '✨';
};
