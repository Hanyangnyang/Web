// 훅(ViewModel): 곡추천하기 화면 진입 시 1일 추천 곡 수 제한/최근 7일 중복 추천/임시 차단 사전 확인
import { useQuery } from '@tanstack/react-query';
import { getSongCreationStatusUseCase } from '../../../di.js';
import { getOrCreateAnonymousUserId } from '../../../lib/supabase.js';
import { SONG_CREATION_STATUS_QUERY_KEY } from './playlistQueryKeys.js';

export function useSongCreationStatus() {
  const query = useQuery({
    queryKey: SONG_CREATION_STATUS_QUERY_KEY,
    queryFn: async () => {
      const deviceId = await getOrCreateAnonymousUserId();
      return getSongCreationStatusUseCase.execute({ deviceId });
    },
    staleTime: 0,
  });

  // 이 화면에 들어온 뒤 서버에서 실제로 받아온 값만 "확정"으로 돌려줌. 쿼리 캐시가 localStorage에 24시간 저장되고
  // 메모리 캐시(gcTime 24시간)도 남아 있어서, 어제 한도를 다 채워 canCreate:false로 저장된 값이 오늘 진입 직후
  // 재조회 응답이 오기 전까지 "한도 소진" 팝업으로 잠깐 뜨는 걸 막기 위함. 확정 전(undefined)이거나 조회가
  // 실패한 경우엔 화면이 막지 않고 진행하고, 서버가 등록 시 최종 판단함
  const isConfirmed = query.isSuccess && query.isFetchedAfterMount;

  return {
    data: isConfirmed ? query.data : undefined,
    // 재조회가 실패한 상태 — 화면이 "등록 가능 여부를 확인하지 못했어요" 안내와 재확인 버튼을 띄우는 데 씀
    isError: query.isError,
    isFetching: query.isFetching,
    refetch: query.refetch,
  };
}
