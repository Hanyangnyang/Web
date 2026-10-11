// 훅(ViewModel): 소식탭 플레이리스트 배너용 가수·대표곡 추천 카드
import { useQuery } from '@tanstack/react-query';
import { getArtistRecommendationsUseCase } from '../../../di.js';
import { getOrCreateAnonymousUserId } from '../../../lib/supabase.js';
import { ARTIST_RECOMMENDATIONS_QUERY_KEY } from './playlistQueryKeys.js';

// 서버가 기기별로 5분 캐시하고 캐시가 만료돼 다시 계산될 때 새 가수 추첨이 바뀌므로, 클라이언트도 같은 5분을 staleTime으로 둬서
// 소식탭에 들어올 때(isActive)만 이 시간이 지났으면 다시 받음. 활동(재생·좋아요)마다 재조회하거나 폴링하지 않음
const RECOMMENDATIONS_STALE_TIME = 5 * 60 * 1000;

export function useArtistRecommendations(isActive = true) {
  return useQuery({
    queryKey: ARTIST_RECOMMENDATIONS_QUERY_KEY,
    queryFn: async () => {
      const deviceId = await getOrCreateAnonymousUserId();
      return getArtistRecommendationsUseCase.execute({ deviceId });
    },
    staleTime: RECOMMENDATIONS_STALE_TIME,
    enabled: isActive,
    // 빈 결과·실패 시 배너를 숨길 뿐이라 자동 재시도로 서버를 두드리지 않음
    retry: false,
  });
}
