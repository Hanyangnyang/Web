// 게시글에 남길 수 있는 이모지 반응 9종. BE와 주고받을 때는 이모지 문자 대신 key(enum)를 사용
export type ReactionKey =
  | 'LOVE'
  | 'EMOTIONAL'
  | 'BITTERSWEET'
  | 'COOL'
  | 'FIRE'
  | 'ROCK'
  | 'DANCE'
  | 'THUMBS_UP'
  | 'BEER';

export const EMOJI_REACTIONS: { key: ReactionKey; emoji: string }[] = [
  { key: 'LOVE', emoji: '😍' },
  { key: 'EMOTIONAL', emoji: '🥹' },
  { key: 'BITTERSWEET', emoji: '🥲' },
  { key: 'COOL', emoji: '😎' },
  { key: 'FIRE', emoji: '🔥' },
  { key: 'ROCK', emoji: '🤘' },
  { key: 'DANCE', emoji: '🕺' },
  { key: 'THUMBS_UP', emoji: '👍' },
  { key: 'BEER', emoji: '🍻' },
];
