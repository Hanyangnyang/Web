// 레포지토리: 도서관 API 응답을 LibraryRoom 엔티티로 변환
import { apiError } from '../../infrastructure/http/HttpClient.js';
import { createLibraryRoom } from '../../domain/entities/LibraryRoom.js';
import type { LibraryApiDataSource } from '../datasources/LibraryApiDataSource.js';
import type { LibraryRepository } from '../../domain/repositories/ILibraryRepository.js';
import { AvailableSeatResponseDataSchema, ReadingRoomDtoSchema, type ReadingRoomDto } from '../schemas/LibrarySchema.js';

const AREA = '도서관 혼잡도'; // Sentry 태그용 — 이 레포지토리가 던지는 모든 검증 에러에 공통으로 붙는 한글 이름표

const LIBRARY_SORT_ORDER: ReadingRoomDto['room'][] = [
  'FIRST_READING_ROOM',
  'SECOND_READING_ROOM',
  'HOLMZ',
  'QUIET_ROOM',
];

// 화면 노출 순서를 고정하기 위한 정렬 키 반환
const sortIndex = (room: ReadingRoomDto['room']) => {
  const index = LIBRARY_SORT_ORDER.indexOf(room);
  return index === -1 ? LIBRARY_SORT_ORDER.length : index;
};

export const createLibraryRepository = (
  { libraryApiDataSource }: { libraryApiDataSource: LibraryApiDataSource }
): LibraryRepository => ({
  getStatus: async () => {
    const res = await libraryApiDataSource.getStatus();
    // 1. success 실패했을때, Error 반환
    if (!res.success)
      throw apiError(res.error?.message || `library API returned 'success:false'`, { area: AREA, endpoint: res._requestUrl });

    // 2. data shape이 스키마와 안 맞을때, 필드별 사유를 담아 Error 반환
    const parsed = AvailableSeatResponseDataSchema.safeParse(res.data);
    if (!parsed.success)
      throw apiError(
        `library API returned invalid shaped 'data': ${parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')}`,
        { area: AREA, endpoint: res._requestUrl }
      );

    // 3. 열람실 항목은 하나가 이상해도(좌석 수 필드 이상) 그 항목만 제외 — 걸러낸 뒤에도 하나도
    // 안 남으면 Error 반환.
    // ⚠️ 임시 조치: 지금은 백엔드가 "휴무일" 개념을 안 내려줘서 readingRooms:[]가 나올 이유가 없다 —
    // 그래서 지금은 이걸 이례적인 상태로 취급한다. 나중에 백엔드가 휴무일 정보를 내려주기 시작하면
    // 이 분기부터 지우고 다시 정상적인 빈 상태(재시도 버튼 없는 UI)로 되돌릴 것 — 관련 이슈: [Library-Seats]
    const rooms = parsed.data.readingRooms
      .map(r => ReadingRoomDtoSchema.safeParse(r))
      .filter(r => r.success)
      .map(r => r.data);
    if (rooms.length === 0)
      throw apiError('library API returned no reading rooms', { area: AREA, endpoint: res._requestUrl });

    const list = rooms
      .sort((a, b) => sortIndex(a.room) - sortIndex(b.room))
      .map(room => createLibraryRoom({
        id: room.room,
        name: room.roomName,
        total: room.totalSeat,
        occupied: room.occupiedSeats,
        available: room.availableSeats,
      }));

    return { list, updatedAt: parsed.data.updatedAt };
  },
});
