// Spotify 곡 검색 API 응답 스키마 — 런타임 검증과 DTO 타입을 zod 하나로 통일
import { z } from 'zod';

// 개별 곡. 항목 하나가 이상해도(trackId 누락 등) 그 곡만 빠지게 하고 싶어서 상위 스키마에
// 배열로 중첩하지 않고 Repository에서 항목별로 개별 parse한다.
// 식별·표시에 꼭 필요한 trackId/title/artist가 없으면 그 곡은 버리고, 없어도 화면이 깨지지 않는
// albumArtUrl/recommendationCount는 기본값으로 채운다
export const MusicSearchTrackDtoSchema = z.object({
  trackId: z.string().min(1),
  title: z.string(),
  artist: z.string(),
  albumArtUrl: z.string().catch(''),
  recommendationCount: z.number().catch(0),
});

// data 봉투. tracks가 배열이 아니면(구조적으로 잘못된 응답) 그대로 실패시켜서 Repository가
// apiError로 던지게 한다 — 조용히 빈 목록으로 감추면 진짜 장애가 "검색 결과 없음"과 구분이 안 된다
export const MusicSearchDataSchema = z.object({
  tracks: z.array(z.unknown()),
});

export type MusicSearchTrackDto = z.infer<typeof MusicSearchTrackDtoSchema>;
