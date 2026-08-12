// 도메인 엔티티: 도서관 열람실 혼잡도 상태 (좌석 수 → 혼잡도 등급으로 변환)
export type LibraryRoomStatus = '쾌적' | '보통' | '혼잡' | '매우 혼잡';

export interface LibraryRoomInput {
  id: string;
  name: string;
  total: number;
  occupied: number;
  available: number;
}

export interface LibraryRoom extends LibraryRoomInput {
  ratio: number;
  status: LibraryRoomStatus;
}

export const createLibraryRoom = ({ id, name, total, occupied, available }: LibraryRoomInput): LibraryRoom => {
  const ratio = occupied / total;

  let status: LibraryRoomStatus = '쾌적';
  if (ratio > 0.67) status = '매우 혼잡';
  else if (ratio > 0.5) status = '혼잡';
  else if (ratio > 0.33) status = '보통';

  return { id, name, total, occupied, available, ratio, status };
};
