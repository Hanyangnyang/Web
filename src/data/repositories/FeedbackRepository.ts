// 레포지토리: 피드백 제출 (유저 식별 + 플랫폼 태깅 조합)
import { getPlatform } from '../../lib/platform.js';
import type { FeedbackDataSource } from '../datasources/FeedbackDataSource.js';

export interface FeedbackRepository {
  submit: (content: string) => Promise<void>;
}

export const createFeedbackRepository = (
  { feedbackDataSource }: { feedbackDataSource: FeedbackDataSource }
): FeedbackRepository => ({
  submit: async (content) => {
    const userId = await feedbackDataSource.getUserId();
    await feedbackDataSource.insertFeedback({ userId, content, platform: getPlatform() });
  },
});
