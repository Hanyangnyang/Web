// 데이터 소스: 도서관 열람실 좌석 현황 API 원시 호출
import { parseOrThrow, type ApiResponse, type HttpClient } from '../../infrastructure/http/HttpClient.js';

export interface ReadingRoomDto {
  room: 'FIRST_READING_ROOM' | 'SECOND_READING_ROOM' | 'HOLMZ' | 'QUIET_ROOM';
  roomName: string;
  totalSeat: number;
  availableSeats: number;
  occupiedSeats: number;
}

export interface AvailableSeatResponseDto {
  readingRooms: ReadingRoomDto[];
  updatedAt: string; // ISO 8601 date-time
}

export interface LibraryApiDataSource {
  getStatus: () => Promise<ApiResponse<AvailableSeatResponseDto>>;
}

export const createLibraryApiDataSource = ({ httpClient }: { httpClient: HttpClient }): LibraryApiDataSource => ({
  getStatus: async () => parseOrThrow(await httpClient.get('/api/v1/library/seats')),
});
