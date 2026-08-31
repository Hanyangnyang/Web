// 레포지토리: 새 백엔드 통합 피드백 접수 — 유저 식별 + 플랫폼 태깅을 채워서 새 백엔드로 전송
import { apiError } from '../../infrastructure/http/HttpClient.js';
import { getOrCreateAnonymousUserId } from '../../lib/supabase.js';
import { getPlatform } from '../../lib/platform.js';
import type { FeedbackApiDataSource } from '../datasources/FeedbackApiDataSource.js';
import type { FeedbackApiRepository } from '../../domain/repositories/IFeedbackApiRepository.js';

const AREA = '피드백';

export const createFeedbackApiRepository = (
  { feedbackApiDataSource }: { feedbackApiDataSource: FeedbackApiDataSource }
): FeedbackApiRepository => ({
  submit: async (params) => {
    const userId = await getOrCreateAnonymousUserId();

    const res = await feedbackApiDataSource.submit({
      userId,
      category: params.category,
      feedbackType: params.feedbackType,
      content: params.content,
      targetId: params.targetId,
      platform: getPlatform(),
      appVersion: params.appVersion,
      contact: params.contact,
    });

    if (!res.success)
      throw apiError(res.error?.message || `feedback submit API returned 'success:false'`, { area: AREA, endpoint: res._requestUrl });
  },
});
