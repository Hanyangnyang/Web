// 데이터 소스: 피드백 제출 관련 Supabase 원시 호출 (BFF를 거치지 않고 클라이언트에서 직접 연결)
import { supabase, getOrCreateAnonymousUserId } from '../../lib/supabase.js';

export interface FeedbackDataSource {
  getUserId: () => Promise<string>;
  insertFeedback: (params: { userId: string; content: string; platform: string }) => Promise<void>;
}

export const createFeedbackDataSource = (): FeedbackDataSource => ({
  getUserId: getOrCreateAnonymousUserId,

  insertFeedback: async ({ userId, content, platform }) => {
    const { error } = await supabase.from('feedbacks').insert({
      user_id: userId,
      content,
      platform,
    });
    if (error) throw error;
  },
});
