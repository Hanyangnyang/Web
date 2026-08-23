// 레포지토리: 도서관 API 응답을 LibraryRoom 엔티티로 변환
import { createLibraryRoom } from '../../domain/entities/LibraryRoom.js';
import type { LibraryApiDataSource, ReadingRoomDto } from '../datasources/LibraryApiDataSource.js';
import type { LibraryRepository } from '../../domain/repositories/ILibraryRepository.js';

// 화면 노출 순서를 열람실 코드로 고정한다 
const LIBRARY_SORT_ORDER: ReadingRoomDto['room'][] = [
  'FIRST_READING_ROOM',
  'SECOND_READING_ROOM',
  'HOLMZ',
  'QUIET_ROOM',
];

// 목록에 없는 열람실이 새로 생겨도 맨 뒤에 붙게 한다
const sortIndex = (room: ReadingRoomDto['room']) => {
  const index = LIBRARY_SORT_ORDER.indexOf(room);
  return index === -1 ? LIBRARY_SORT_ORDER.length : index;
};

export const createLibraryRepository = (
  { libraryApiDataSource }: { libraryApiDataSource: LibraryApiDataSource }
): LibraryRepository => ({
  getStatus: async () => {
    const res = await libraryApiDataSource.getStatus();
    // success 실패했을때 
    if (!res.success) throw new Error(res.error?.message || 'library API returned success:false');
    // data 비어서왔을때 
    if (!Array.isArray(res.data?.readingRooms)) throw new Error('library API returned invalid shape');

    const list = [...res.data.readingRooms]
      .sort((a, b) => sortIndex(a.room) - sortIndex(b.room))
      .map(room => createLibraryRoom({
        id: room.room,
        name: room.roomName,
        total: room.totalSeat,
        occupied: room.occupiedSeats,
        available: room.availableSeats,
      }));

    return { list, updatedAt: res.data.updatedAt };
  },
});
