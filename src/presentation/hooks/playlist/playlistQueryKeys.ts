// 여러 플레이리스트 훅이 함께 쓰는 쿼리 키/캐시 헬퍼 — 그 자체로는 훅이 아니라서 이 폴더의
// 다른 파일들처럼 use*.ts 1:1 규칙 대상이 아니고, 공유 상수/유틸이라 이름을 그대로 둠
import type { QueryClient } from '@tanstack/react-query';
import type { Song } from '../../components/playlist/playlistTypes.js';

export const RECENT_SONGS_QUERY_KEY = ['playlist', 'recent-songs'];
export const BOOKMARKED_SONGS_QUERY_KEY = ['playlist', 'bookmarked-songs'];
export const MY_SONGS_QUERY_KEY = ['playlist', 'my-songs'];

// 최근추가된곡/저장한곡/내가등록한곡 화면은 모두 이 세 캐시 중 하나에서 목록을 읽는데, 화면을 나갔다 들어오면
// SongListScreen/PostDetailCard가 통째로 리마운트되면서 카드 안에서만 들고 있던 낙관적 업데이트(북마크/반응)가
// 사라진다. 그 시점에 이 캐시들이 아직 옛날 값이면(백그라운드 refetch가 안 끝났으면) 방금 한 반응이 안 보였다가,
// 다음번 재진입에야(그땐 refetch가 이미 끝나서) 보이는 것처럼 느껴짐 — 그래서 토글 성공 시 여기 캐시들도 같이 패치
const SONG_LIST_QUERY_KEYS = [RECENT_SONGS_QUERY_KEY, BOOKMARKED_SONGS_QUERY_KEY, MY_SONGS_QUERY_KEY];

export function patchSongInListCaches(queryClient: QueryClient, songId: string, patch: (song: Song) => Song) {
  for (const key of SONG_LIST_QUERY_KEYS) {
    queryClient.setQueryData<Song[]>(key, (prev) => prev?.map((song) => (song.id === songId ? patch(song) : song)));
  }
}

// useSongSearch(게시글 검색)/useMusicSearch(Spotify 곡 검색)가 공유하는 최소 글자 수 — 이보다 짧으면 호출하지 않음
export const SONG_SEARCH_MIN_LENGTH = 2;
