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
  const ratio = total > 0 ? occupied / total : 0;

  let status: LibraryRoomStatus = '쾌적';
  if (ratio > 0.67) status = '매우 혼잡';
  else if (ratio > 0.5) status = '혼잡';
  else if (ratio > 0.33) status = '보통';

  return { id, name, total, occupied, available, ratio, status };
};

// 소식탭 열람실 카드에 "오픈스페이스는 어때요?" 안내를 띄울 혼잡 기준.
// 제1열람실·제2열람실·노상일 HOLMZ 중 한 곳이라도 '매우 혼잡'(점유율 67% 초과)이면 띄운다.
// 집중열람실(QUIET_ROOM)은 좌석이 10여 석뿐이라 몇 명만 앉아도 등급이 크게 출렁여서 판정에서 뺀다.
// 이름(roomName)은 백엔드가 바꿀 수 있어 id(백엔드 room enum)로 고른다
const CROWDING_ROOM_IDS = ['FIRST_READING_ROOM', 'SECOND_READING_ROOM', 'HOLMZ'];

export const isLibraryCrowded = (rooms: LibraryRoom[]): boolean =>
  rooms.some((room) => CROWDING_ROOM_IDS.includes(room.id) && room.status === '매우 혼잡');
