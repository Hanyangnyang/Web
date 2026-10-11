// 곡 등록 가능 상태 API 응답 스키마 — 런타임 검증과 DTO 타입을 zod 하나로 통일
import { z } from 'zod';

// canCreate는 화면의 팝업·등록 버튼을 직접 좌우하는 핵심 값이라 기본값으로 감추지 않고, 없거나 타입이
// 틀리면 스키마 전체를 실패시켜 Repository가 apiError로 던지게 한다(조회 실패와 같은 취급 — 화면은 "아직 모름"으로 진행).
// 나머지는 틀려도 화면이 안전한 쪽으로 동작하는 값만 기본값으로 채운다
export const SongCreationStatusSchema = z.object({
  canCreate: z.boolean(),
  dailyCount: z.number().catch(0),
  dailyMaxLimit: z.number().catch(3),
  remainingCount: z.number().catch(0),
  recentTrackIdsIn7Days: z.array(z.string()).catch([]),
  temporarilyBlocked: z.boolean().catch(false),
  blockedUntil: z.string().nullable().catch(null),
});

export type SongCreationStatusDto = z.infer<typeof SongCreationStatusSchema>;
