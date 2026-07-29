// 훅(ViewModel): 인스타그램 계정 프로필 일괄 조회 및 상태 관리
import { useState, useEffect } from 'react';
import { INSTA_ACCOUNTS } from '../../domain/entities/InstagramAccount.js';
import { getInstagramProfileUseCase, instagramRepository } from '../../di.js';

export function useInstagram() {
  const [profiles, setProfiles] = useState({});

  useEffect(() => {
    const allAccounts = [...INSTA_ACCOUNTS.erica, ...INSTA_ACCOUNTS.college];
    allAccounts.forEach(async ({ username }) => {
      try {
        const profile = await getInstagramProfileUseCase.execute(username);
        setProfiles(prev => ({ ...prev, [username]: profile }));
      } catch (e) {
        console.error(`인스타 조회 실패 (${username}):`, e);
      }
    });
  }, []);

  const getProxiedUrl = (originalUrl) => instagramRepository.getProxiedImageUrl(originalUrl);

  return { profiles, getProxiedUrl };
}
