// 레포지토리: 인스타그램 API 응답을 InstagramProfile 엔티티로 변환
import { createInstagramProfile, INSTA_ACCOUNTS } from '../../domain/entities/InstagramAccount.js';

export const createInstagramRepository = ({ instagramApiDataSource }) => ({
  getProfile: async (username) => {
    // 1. 로컬 데이터 확인 (지속 가능성 및 성능을 위해 우선순위 높임)
    const allAccounts = [...INSTA_ACCOUNTS.erica, ...INSTA_ACCOUNTS.college];
    const localAccount = allAccounts.find(a => a.username === username);

    if (localAccount) {
      return createInstagramProfile({
        username: localAccount.username,
        fullName: localAccount.desc,
        profilePicUrl: localAccount.profilePicUrl || '/hanyang_insta_fallback.png',
        desc: localAccount.desc,
      });
    }

    // 2. 로컬에 없는 경우 API 시도 (폴백)
    try {
      const data = await instagramApiDataSource.getProfile(username);
      return createInstagramProfile({
        username: data.username,
        fullName: data.fullName || username,
        profilePicUrl: data.profilePicUrl || null,
        desc: '',
      });
    } catch (e) {
      console.error(`Instagram API fallback failed for ${username}:`, e);
      return createInstagramProfile({
        username,
        fullName: username,
        profilePicUrl: '/hanyang_insta_fallback.png',
        desc: '',
      });
    }
  },

  getProxiedImageUrl: (originalUrl) => originalUrl,
});
