// 훅(ViewModel): 곡추천하기 화면 진입 시 1일 3곡 제한/최근 7일 중복 추천 사전 확인
import { useQuery } from '@tanstack/react-query';
import { getSongCreationStatusUseCase } from '../../../di.js';
import { getOrCreateAnonymousUserId } from '../../../lib/supabase.js';

export function useSongCreationStatus() {
  return useQuery({
    queryKey: ['playlist', 'creation-status'],
    queryFn: async () => {
      const deviceId = await getOrCreateAnonymousUserId();
      return getSongCreationStatusUseCase.execute({ deviceId });
    },
    staleTime: 0,
  });
}
