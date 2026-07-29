// 훅(ViewModel): 인스타그램 계정 프로필 일괄 조회 (TanStack Query 기반)
import { useQueries } from '@tanstack/react-query';
import { INSTA_ACCOUNTS, type InstagramProfile } from '../../domain/entities/InstagramAccount.js';
import { getInstagramProfileUseCase, instagramRepository } from '../../di.js';

// 로컬에 등록된 계정은 즉시 반환되고, 원격 폴백일 때만 실제 네트워크를 타므로 넉넉하게 잡아도 됨
const INSTAGRAM_STALE_TIME = 24 * 60 * 60 * 1000; // 24시간

const ALL_ACCOUNTS = [...INSTA_ACCOUNTS.erica, ...INSTA_ACCOUNTS.college];

export interface UseInstagramResult {
  profiles: Record<string, InstagramProfile>;
  getProxiedUrl: (originalUrl: string) => string;
}

export function useInstagram(): UseInstagramResult {
  const results = useQueries({
    queries: ALL_ACCOUNTS.map(({ username }) => ({
      queryKey: ['instagram', 'profile', username],
      queryFn: () => getInstagramProfileUseCase.execute(username),
      staleTime: INSTAGRAM_STALE_TIME,
    })),
  });

  const profiles = ALL_ACCOUNTS.reduce<Record<string, InstagramProfile>>((acc, { username }, i) => {
    const data = results[i].data;
    if (data) acc[username] = data;
    return acc;
  }, {});

  const getProxiedUrl = (originalUrl: string) => instagramRepository.getProxiedImageUrl(originalUrl);

  return { profiles, getProxiedUrl };
}
