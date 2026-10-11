// 여러 플레이리스트 훅이 함께 쓰는 쿼리 키/캐시 헬퍼 — 그 자체로는 훅이 아니라서 이 폴더의
// 다른 파일들처럼 use*.ts 1:1 규칙 대상이 아니고, 공유 상수/유틸이라 이름을 그대로 둠
import type { InfiniteData, QueryClient } from '@tanstack/react-query';
import type { Song } from '../../components/playlist/playlistTypes.js';
import type { PopularityChart } from '../../../domain/entities/PopularityChart.js';

// 최근 추가된 곡은 홈 미리보기와 전체 보기가 *_INFINITE_* 키(페이지 단위 캐시)를 같이 씀 — 장르를 고르면 이 키 뒤에 장르 키가 붙은 캐시가 따로 생김
export const MY_SONGS_QUERY_KEY = ['playlist', 'my-songs'];
export const RECENT_SONGS_INFINITE_QUERY_KEY = ['playlist', 'recent-songs-pages'];
export const MY_SONGS_INFINITE_QUERY_KEY = ['playlist', 'my-songs-pages'];
// 저장한 곡은 미리보기 없이 전체 화면만 있어서 무한 스크롤 캐시 하나뿐
export const LIKED_SONGS_QUERY_KEY = ['playlist', 'liked-songs'];
export const SONG_CREATION_STATUS_QUERY_KEY = ['playlist', 'creation-status'];
export const ARTIST_RECOMMENDATIONS_QUERY_KEY = ['playlist', 'artist-recommendations'];

// 최근추가된곡/저장한곡/내가등록한곡 화면은 모두 이 세 캐시 중 하나에서 목록을 읽는데, 화면을 나갔다 들어오면
// SongListScreen/PostDetailCard가 통째로 리마운트되면서 카드 안에서만 들고 있던 낙관적 업데이트(좋아요/반응)가
// 사라진다. 그 시점에 이 캐시들이 아직 옛날 값이면(백그라운드 refetch가 안 끝났으면) 방금 한 반응이 안 보였다가,
// 다음번 재진입에야(그땐 refetch가 이미 끝나서) 보이는 것처럼 느껴짐 — 그래서 토글 성공 시 여기 캐시들도 같이 패치
// 무한 스크롤 목록의 한 페이지 — last는 서버가 알려준 "마지막 페이지인지"
export interface SongPage {
  songs: Song[];
  last: boolean;
}
export type SongPagesData = InfiniteData<SongPage, number>;

const SONG_ARRAY_QUERY_KEYS = [MY_SONGS_QUERY_KEY];
const SONG_PAGES_QUERY_KEYS = [RECENT_SONGS_INFINITE_QUERY_KEY, LIKED_SONGS_QUERY_KEY, MY_SONGS_INFINITE_QUERY_KEY];

// 배열 캐시(홈 미리보기)와 페이지 캐시(전체 보기)에 같은 변환을 적용
function mapSongsInListCaches(queryClient: QueryClient, transform: (songs: Song[]) => Song[]) {
  for (const key of SONG_ARRAY_QUERY_KEYS) {
    queryClient.setQueriesData<Song[]>({ queryKey: key }, (prev) => prev && transform(prev));
  }
  for (const key of SONG_PAGES_QUERY_KEYS) {
    // 최근 추가된 곡은 장르별 캐시(['playlist','recent-songs-pages','indie'] 등)가 같은 접두사로 따로 있어서 전부 패치
    queryClient.setQueriesData<SongPagesData>({ queryKey: key }, (prev) => prev && { ...prev, pages: prev.pages.map((page) => ({ ...page, songs: transform(page.songs) })) });
  }
}

export function patchSongInListCaches(queryClient: QueryClient, songId: string, patch: (song: Song) => Song) {
  mapSongsInListCaches(queryClient, (songs) => songs.map((song) => (song.id === songId ? patch(song) : song)));
}

// 곡 단위 좋아요는 같은 곡(trackId)의 모든 게시글에 공통 적용되므로 trackId가 같은 게시글을 전부 패치
export function patchTrackInListCaches(queryClient: QueryClient, trackId: string, patch: (song: Song) => Song) {
  mapSongsInListCaches(queryClient, (songs) => songs.map((song) => (song.trackId === trackId ? patch(song) : song)));
}

// 방금 등록한 곡을 페이지 캐시의 맨 앞(첫 페이지 맨 위)에 얹음 — 캐시가 아직 없으면 진행 중인 최초 조회에 맡김
export function prependSongToPagesCache(queryClient: QueryClient, key: readonly unknown[], song: Song) {
  queryClient.setQueryData<SongPagesData>(key, (prev) =>
    prev && { ...prev, pages: prev.pages.map((page, i) => (i === 0 ? { ...page, songs: [song, ...page.songs] } : page)) }
  );
}

// 인기차트 캐시 키 — period(popular/weekly/monthly)별로 ['playlist', 'chart', period]로 저장됨
export const CHART_QUERY_KEY = ['playlist', 'chart'];

// 좋아요는 곡 단위라 실시간/주간/월간 차트 캐시 전부에서 같은 곡의 isLiked를 맞춤.
// 차트 캐시를 길게 들고 있으니(staleTime) 어느 화면에서 좋아요를 눌러도 차트 하트가 같이 맞춰져야 함
export function patchTrackInChartCaches(queryClient: QueryClient, trackId: string, isLiked: boolean) {
  queryClient.setQueriesData<PopularityChart>({ queryKey: CHART_QUERY_KEY }, (prev) =>
    prev && { ...prev, tracks: prev.tracks.map((t) => (t.trackId === trackId ? { ...t, isLiked } : t)) }
  );
}

// useSongSearch(게시글 검색)/useMusicSearch(Spotify 곡 검색)가 공유하는 최소 글자 수 — 이보다 짧으면 호출하지 않음
export const SONG_SEARCH_MIN_LENGTH = 2;
