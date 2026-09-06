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
  체육: '🤸‍♂️',
  학술교양: '📚',
  봉사: '🤝',
  종교: '✝️',
};

// 프로필 이미지 원본이 정사각형 썸네일에 그대로 맞지 않아 보정이 필요한 동아리들.
// object-fit(cover/contain)만으로는 원본에 이미 baked-in된 문제를 못 없애서, 원인별로
// 다른 transform을 직접 지정한다. 값은 각 이미지를 실측(배지 bbox 비율)해서 계산.
export const clubImageTransform: Record<string, string> = {
  // 1) 정사각형 캔버스인데 배지 자체가 원형이 아니라 세로로 긴 타원으로 그려져 있어,
  //    작게 보면 눌린 것처럼 보이는 경우 — 가로로만 scaleX해서 다시 원형에 가깝게 편다.
  typhoon: 'scaleX(1.42)',
  martini: 'scaleX(1.31)',
  'hy-pass': 'scaleX(1.47)',
  rotaract: 'scaleX(1.44)',
  ebs: 'scaleX(1.39)',
  hanya: 'scaleX(1.36)',
  yacht: 'scaleX(1.40)',
  maha: 'scaleX(1.41)',
  // 2) 로고/카드 자체는 세로로 긴 직사각형인데 정사각형 파일로 만들면서 좌우에 여백을
  //    덧대놔서, 정사각형 배지에 넣으면 로고가 가운데로 쪼그라들어 보이는 경우 —
  //    양옆 여백을 크롭하도록 균일하게(scaleX와 scaleY를 같은 값으로) 확대한다.
  pin: 'scale(1.24)',
  'hy-fly': 'scale(1.34)',
  husa: 'scale(1.20)',
  herc: 'scale(1.25)',
  hytec: 'scale(1.32)',
  hiclear: 'scale(1.17)',
  pichinyang: 'scale(1.19)',
  giwoo: 'scale(1.37)',
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
