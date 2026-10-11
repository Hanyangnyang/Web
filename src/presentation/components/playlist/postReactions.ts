// 게시글에 남길 수 있는 이모지 반응 key. BE와 주고받을 때는 이모지 문자 대신 key(enum)를 사용.
// BE는 11종을 내려주지만(BITTERSWEET/ROCK/DANCE/BEER는 기존 데이터 호환용으로만 유지), 화면에는 아래 EMOJI_REACTIONS의 7종만 보여준다
export type ReactionKey =
  | 'LOVE'
  | 'EMOTIONAL'
  | 'BITTERSWEET'
  | 'COOL'
  | 'FIRE'
  | 'ROCK'
  | 'DANCE'
  | 'THUMBS_UP'
  | 'BEER'
  | 'SURPRISED'
  | 'ANGRY';

// 화면에 표시하는 7종(선택창·반응 칩 공통, 이 순서대로). 목록에 없는 key는 서버 응답에 있어도 숨겨짐
export const EMOJI_REACTIONS: { key: ReactionKey; emoji: string }[] = [
  { key: 'THUMBS_UP', emoji: '👍' },
  { key: 'LOVE', emoji: '😍' },
  { key: 'COOL', emoji: '😎' },
  { key: 'EMOTIONAL', emoji: '🥹' },
  { key: 'SURPRISED', emoji: '😮' },
  { key: 'ANGRY', emoji: '😡' },
  { key: 'FIRE', emoji: '🔥' },
];
