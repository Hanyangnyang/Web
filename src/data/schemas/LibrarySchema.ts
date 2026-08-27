// 도서관 열람실 좌석 현황 API 응답 스키마 — 런타임 검증과 DTO 타입을 zod 하나로 통일
import { z } from 'zod';

// 개별 열람실
export const ReadingRoomDtoSchema = z.object({
  room: z.enum(['FIRST_READING_ROOM', 'SECOND_READING_ROOM', 'HOLMZ', 'QUIET_ROOM']),
  roomName: z.string(),
  totalSeat: z.number(),
  availableSeats: z.number(),
  occupiedSeats: z.number(),
});

export const AvailableSeatResponseDataSchema = z.object({
  readingRooms: z.array(z.unknown()).catch([]), // 개별 항목 검증은 ReadingRoomDtoSchema로 Repository에서 수행
  updatedAt: z.string().catch(''),
});

export type ReadingRoomDto = z.infer<typeof ReadingRoomDtoSchema>;
