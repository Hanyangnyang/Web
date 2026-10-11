// 가수 추천 API 응답 스키마 — 런타임 검증과 DTO 타입을 zod 하나로 통일
import { z } from 'zod';

const ArtistDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  imageUrl: z.string().nullable().catch(null),
});

export const ArtistRecommendationItemSchema = z.object({
  artist: ArtistDtoSchema,
  track: z.object({
    trackId: z.string(),
    title: z.string(),
    albumArtUrl: z.string().nullable().catch(null),
    artists: z.array(ArtistDtoSchema).catch([]),
  }),
  // 백엔드가 새 출처를 추가해도 카드 자체를 버리진 않도록 모르는 값은 주간차트로 취급
  source: z.enum(['INTEREST', 'DISCOVERY', 'WEEKLY_CHART']).catch('WEEKLY_CHART'),
});

// items가 배열이 아니면 응답 형태가 바뀐 것이라 실패시킴(0개는 정상)
export const ArtistRecommendationsDataSchema = z.object({
  items: z.array(z.unknown()),
});
