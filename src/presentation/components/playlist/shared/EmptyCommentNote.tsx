// 곡 한마디가 비어 있을 때 사용자 글 자리에 대신 채우는 앱 문구 — 한마디는 선택 입력이라 비어 올 수 있음.
// 사용자 글은 큰따옴표("…")+본문색으로 보이므로, 이 문구는 따옴표 없이 발바닥 이모지 + 연한 이탤릭으로 그려서
// "사용자가 쓴 글이 아니다"가 한눈에 구분되게 함. 글자 크기·말줄임·색(어두운 배경 등)은 className으로 덮어씀
export const EMPTY_COMMENT_NOTE = '🐾하냥이의 추천곡, 들어볼까요';

interface EmptyCommentNoteProps {
  className?: string;
}

export function EmptyCommentNote({ className = 'text-xs text-text-hint' }: EmptyCommentNoteProps) {
  return <p className={`leading-snug ${className}`}>{EMPTY_COMMENT_NOTE}</p>;
}
