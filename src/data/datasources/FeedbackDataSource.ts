// 데이터 소스: 피드백 제출 관련 Supabase 원시 호출 (BFF를 거치지 않고 클라이언트에서 직접 연결)
import { supabase } from '../../lib/supabase.js';

export interface FeedbackDataSource {
  getUserId: () => Promise<string>;
  insertFeedback: (params: { userId: string; content: string; platform: string }) => Promise<void>;
}

export const createFeedbackDataSource = (): FeedbackDataSource => ({
  // 기존 세션이 있으면 재사용하고, 없으면 즉석에서 익명 로그인
  getUserId: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) return session.user.id;

    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
    if (!data.session) throw new Error('Anonymous sign-in returned no session');
    return data.session.user.id;
  },

  insertFeedback: async ({ userId, content, platform }) => {
    const { error } = await supabase.from('feedbacks').insert({
      user_id: userId,
      content,
      platform,
    });
    if (error) throw error;
  },
});
