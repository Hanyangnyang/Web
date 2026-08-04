// 도메인 엔티티: 도서관 열람실 혼잡도 상태 (좌석 수 → 혼잡도 등급/색상/이모지로 변환)

export type LibraryRoomStatus = '쾌적' | '보통' | '혼잡' | '매우 혼잡';

export interface LibraryRoomInput {
  id: number;
  name: string;
  total: number;
  occupied: number;
}

export interface LibraryRoom extends LibraryRoomInput {
  ratio: number;
  status: LibraryRoomStatus;
  color: string;
  emoji: string;
}

export const createLibraryRoom = ({ id, name, total, occupied }: LibraryRoomInput): LibraryRoom => {
  const ratio = occupied / total;

  let status: LibraryRoomStatus = '쾌적';
  let color = '#2563eb';
  let emoji = '🔵';

  if (ratio > 0.67) {
    status = '매우 혼잡'; color = '#991b1b'; emoji = '😫';
  } else if (ratio > 0.5) {
    status = '혼잡';     color = '#ef4444'; emoji = '🔴';
  } else if (ratio > 0.33) {
    status = '보통';     color = '#22c55e'; emoji = '🟢';
  }

  return { id, name, total, occupied, ratio, status, color, emoji };
};
