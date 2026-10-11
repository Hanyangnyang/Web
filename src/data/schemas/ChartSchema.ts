// 인기차트 API 응답 스키마 — 런타임 검증과 DTO 타입을 zod 하나로 통일
import { z } from 'zod';

// 개별 곡. 항목 하나가 이상해도 그 곡만 빠지게 하고 싶어서 상위 스키마에 배열로 중첩하지 않고
// Repository에서 항목별로 개별 parse한다. 순위·식별·표시에 꼭 필요한 rank/trackId/title/artist가 없으면
// 그 곡은 버리고, 없어도 화면이 깨지지 않는 albumArtUrl/isLiked는 기본값으로 채운다
// (isLiked는 deviceId를 보냈을 때만 내려오므로 없으면 "안 누름"으로 취급)
export const ChartTrackDtoSchema = z.object({
  rank: z.number().int().positive(),
  trackId: z.string().min(1),
  title: z.string(),
  artist: z.string(),
  albumArtUrl: z.string().catch(''),
  isLiked: z.boolean().catch(false),
});

// data 봉투. tracks가 배열이 아니면(구조적으로 잘못된 응답) 그대로 실패시켜서 Repository가 apiError로 던지게 한다 —
// 조용히 빈 차트로 감추면 진짜 장애가 "아직 집계 안 됨"과 구분이 안 된다.
// chartType/displayTitle은 제목 표기용이라 틀려도 빈 문자열로 두고 차트 자체는 보여줌
export const ChartDataSchema = z.object({
  chartType: z.string().catch(''),
  displayTitle: z.string().catch(''),
  tracks: z.array(z.unknown()),
});

export type ChartTrackDto = z.infer<typeof ChartTrackDtoSchema>;
