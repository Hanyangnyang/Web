// 정적 JSON을 읽어오는 RQ 훅을 찍어내는 팩토리.
//
// 교내시설·흡연장 훅이 queryKey / staleTime 24h / enabled / loadErr 구조가 완전히 같아서,
// 새 레이어를 추가할 때마다 30줄을 복붙하고 있었다. 다른 건 '무엇을 부르고 뭐라고 부를지'뿐이다.
// (제휴매장은 손으로 관리하던 partnerships.json이던 시절엔 여기 같이 있었지만, 백엔드 API로
// 이전하면서 Redis TTL(12h)에 맞춰야 해서 usePartnerStores.ts가 전용 staleTime으로 분리해나갔다)
import { useQuery } from '@tanstack/react-query';

// 큐레이션·정적 데이터라 자주 안 바뀐다 — 탭을 오가도 재요청하지 않게 넉넉히 잡는다
const STATIC_DATA_STALE_TIME = 24 * 60 * 60 * 1000;

export interface StaticDataQueryOptions {
  /** 해당 레이어가 꺼져 있으면 아예 요청하지 않는다 (칩 토글 기반 지연 로딩) */
  enabled?: boolean;
}

export interface StaticDataQueryResult<T> {
  data: T[];
  loading: boolean;
  loadErr: string | null;
}

interface Params<TRaw, TOut> {
  queryKey: readonly unknown[];
  fetcher: () => Promise<TRaw[]>;
  /** 실패 시 화면에 그대로 노출할 문구 */
  errorMessage: string;
  /** 받아온 뒤 화면에 올리기 전 한 번 걸러야 할 때 (예: 좌표 없는 건물 제외) */
  select?: (raw: TRaw[]) => TOut[];
}

export function createStaticDataQuery<TRaw, TOut = TRaw>({
  queryKey, fetcher, errorMessage, select,
}: Params<TRaw, TOut>) {
  return function useStaticData({ enabled = true }: StaticDataQueryOptions = {}): StaticDataQueryResult<TOut> {
    const { data, isLoading, isError } = useQuery({
      queryKey,
      queryFn: fetcher,
      staleTime: STATIC_DATA_STALE_TIME,
      enabled,
    });

    return {
      data: data ? (select ? select(data) : (data as unknown as TOut[])) : [],
      loading: isLoading,
      loadErr: isError ? errorMessage : null,
    };
  };
}
