# 캐싱 구현

데이터 페칭·캐싱을 **어떻게** 구현했는지 적습니다. 데이터별로 얼마나 최신이어야 하는지(기획 기준)는 private 레포 `Hanyangnyang/Context`의 `context/tech/data-freshness.md`에 있습니다.

**캐시 정책의 단일 출처는 이 문서입니다.** 훅을 새로 만들거나 staleTime·백엔드 TTL을 바꾸면 아래 표를 같이 고칩니다. README에는 요약과 이 문서 링크만 둡니다. 훅 작성 방법 자체는 [conventions.md](conventions.md#hook-작성-규칙)에 있습니다.

## 관련 코드
- `src/lib/queryClient.ts` — TanStack Query 클라이언트(전역 기본값, Sentry 연동, localStorage 영속화)
- `src/presentation/hooks/use*.ts` — 데이터별 queryKey·staleTime (각 파일 맨 위 상수)
- `src/presentation/hooks/createStaticDataQuery.ts` — 정적 데이터(교내건물·흡연장) 쿼리 팩토리, staleTime 24시간
- (참고) `src/infrastructure/storage/SecureStorage.ts`는 Supabase 익명 로그인 세션 저장용이라 데이터 캐싱과는 무관합니다

## 캐시가 두 겹이라는 점

```
앱(TanStack Query 캐시, staleTime) ──요청──> 백엔드(Redis 등 캐시, TTL) ──> 원본(학교 홈페이지·외부 API)
```

- 사용자가 보는 정보의 **최대 지연 = 백엔드 캐시 TTL(또는 갱신 주기) + 앱 staleTime**입니다.
- 그래서 앱 staleTime은 백엔드 TTL보다 길게 잡지 않습니다.
  - 백엔드가 **주기적으로 갱신**하는 데이터는 그 주기에 맞춥니다(날씨 10분, 도서관 3분, 인기차트).
  - 관리자가 수정할 때 **백엔드가 캐시를 바로 지우는(evict)** 데이터는 백엔드 TTL(12시간)보다 훨씬 짧게 잡습니다(셔틀·헬스장·제휴매장 1시간, 배너 5분). 요청이 나가도 대부분 백엔드 캐시에서 바로 응답하므로 부담이 작습니다.
- **백엔드 캐시 TTL이나 갱신 주기를 바꾸면, 아래 표와 해당 훅의 staleTime 주석도 같이 확인하세요.**

## 전역 기본값 (`queryClient.ts`)

| 옵션 | 값 | 이유 |
|---|---|---|
| `staleTime` | 15분 | 훅에서 따로 안 정하면 적용 |
| `gcTime` | 24시간 | 화면에서 안 쓰는 캐시도 하루는 메모리에 유지 |
| `refetchOnWindowFocus` | `false` | 모바일 WebView에선 의미가 없음. 앱 복귀 시 갱신이 필요한 데이터만 훅에서 `visibilitychange`로 직접 처리 |
| `retry` | 최대 2번(총 3번 호출) | 단, 15초 타임아웃이 난 요청과 사용자가 당겨서 새로고침하는 중에는 재시도 안 함 |
| 영속화 | `localStorage`의 `hyu_rq_cache`, maxAge 24시간 | 앱을 다시 켜도 마지막 데이터를 바로 보여주기 위해. 성공한 쿼리 전부가 대상 |
| `CACHE_BUSTER` | `queryClient.ts` 참고 | Entity 모양이 바뀌면 올림. 자세한 기준은 [conventions.md](conventions.md)의 "응답 모양을 바꿀 때" |

staleTime이 지난 데이터는 다시 볼 때(탭 진입·앱 복귀·다시 시도 버튼 등) 옛 값을 먼저 보여주고 뒤에서 새로 받아 바꿉니다(stale-while-revalidate). 네트워크가 다시 연결될 때도 stale이면 다시 받습니다.

## 데이터별 정책

### 학식 · 셔틀 · 소식 · 기타 · 캠퍼스맵

| 탭 | 데이터 | 엔드포인트 | 훅 / queryKey | 앱 staleTime · 폴링 | 백엔드 캐시 | 추가 갱신 시점 |
|---|---|---|---|---|---|---|
| 학식 | 학식 메뉴 (약 1~2주치 한 번에) | `/api/v1/menu` | `useMenu` / `['menu-period']` | 10분 | Redis 12시간, 학교 홈페이지를 1시간마다 스크래핑해 갱신 | 학식 탭을 보는 중 앱 복귀 시, stale이면 재요청 |
| 셔틀 | 셔틀 시간표 | `/api/v1/shuttle` | `useShuttle` / `['shuttle','schedule']` | 1시간 | 12시간, 관리자 수정 시 evict | 학기·요일 구분·운행 여부가 바뀌는 순간 무효화 |
| 셔틀 | 지하철 시간표 | `/api/v1/subway/schedule` | `useShuttle` / `['shuttle','subway-schedule']` | 1시간 | 12시간 | 공휴일 기준 요일 구분이 바뀌는 순간 무효화. 지하철 연결 정류장(기숙사·셔틀콕)에서만 요청 |
| 셔틀·공통 | 학사·셔틀 운영 상태 | `/api/v1/academic/status` | `useAcademicStatus` / `['academic-status', 날짜]` | 5분 | — | 부팅 시 프리페치(`BootContext`, 실패해도 부팅은 진행). 셔틀 탭 진입 시 stale이면 재요청 |
| 셔틀 | 날짜 정보(평일/주말/공휴일) | `/api/v1/holidays/date-info` | `useDateInfo` / `['date-info', 날짜]` | 1시간 | — | — |
| 셔틀 | 공공버스 도착정보 | `/api/bus` (Vercel) | `usePublicBus` / `['bus-arrivals', 정류소]` | **30초 폴링** | Vercel 함수 메모리 캐시 40초, 외부 API 6초 타임아웃 | 버스 화면이 보이고 3분 안에 사용자 활동이 있을 때만 폴링. `retry: 0` |
| 소식 | 날씨·미세먼지 | `/api/v1/weather` | `useWeather` / `['portal','weather']` | 10분 | 10분 | — |
| 소식 | 날씨 브리핑(AI 코멘트) | `/api/v1/weather/briefing` | `useWeatherBriefing` / `['portal','weather','briefing']` | 30분 | 30분, 매시 22분 갱신 | — |
| 소식 | 도서관 좌석 현황 | `/api/v1/library/seats` | `useLibraryStatus` / `['portal','library']` | 3분 | 스케줄러가 3분마다 갱신 | — |
| 소식 | 배너 | `/api/v1/banners` | `useBanners` / `['banners']` | 5분 | 12시간, 관리자 수정 시 evict | 앱 시작 시 프리페치(다음 부팅 스플래시 배너 캐시용) |
| 기타 | 헬스장 시간표 | `/api/v1/gym/gym-periods` | `useGymSchedule` / `['gym','schedule']` | 1시간 | 12시간, 학기 변경 시 evict | 기타 탭 진입 시 프리페치. 1분마다 KST 날짜를 확인해 자정이 지나면 무효화 |
| 캠퍼스맵 | 제휴매장 | `/api/v1/partnership/partnership-available` | `usePartnerStores` / `['partnership','stores']` | 1시간 | Redis 12시간 | — |
| 캠퍼스맵 | 프린터 | `/api/v1/campus-map/printers` | `usePrinters` / `['campus','printers','ANSAN']` | 10분 | — | 수정 제보가 409·404로 실패하면 목록 무효화 |
| 캠퍼스맵 | 교내건물·흡연장 | `/campusBuildings.json`, `/smokingSpots.json` (정적 파일) | `createStaticDataQuery` | 24시간 | 정적 파일 | 레이어 칩을 켤 때만 요청 |

### 플레이리스트 (기타 탭)

| 데이터 | 엔드포인트 | 훅 | 앱 staleTime | 백엔드 캐시 | 비고 |
|---|---|---|---|---|---|
| 곡 목록(최근 추가·저장한 곡·내가 등록한 곡, 무한 스크롤) | `/api/v1/playlist/songs`, `.../songs/tracks/liked`, `.../songs/my-songs` | `useSongListInfinite` 기반 | 1분 | — | 1분 안에 다시 들어오면 캐시를 그대로 보여줌(홈 미리보기도 같은 캐시) |
| 게시글 상세 | `/api/v1/playlist/songs/{id}` | `usePostDetail` | 1분 | — | |
| 게시글 검색 | `/api/v1/playlist/songs/search` | `useSongSearch`, `useSongSearchInfinite` | 0 (항상 재요청) | — | 검색어가 queryKey에 포함 |
| 곡별 게시글 모아보기 | `/api/v1/playlist/songs/tracks/{trackId}` | `useTrackPosts` | 0 | — | 정렬(sort)이 queryKey에 포함 |
| 곡 등록 가능 여부 | `/api/v1/playlist/songs/creation-status` | `useSongCreationStatus` | 0 | — | 하루 등록 한도가 날짜가 바뀌면 풀리므로 항상 새로 받음 |
| 인기 차트 | `/api/v1/playlist/songs/charts` | `usePopularityChart` | 급상승 5분 / 주간·월간 1시간 | 서버 스냅샷: 급상승 매시 40분, 주간 매주 월요일, 월간 매월 1일 | 기간·장르가 queryKey에 포함 |
| 아티스트 추천 | `/api/v1/playlist/recommendations` | `useArtistRecommendations` | 5분 | — | |
| 곡 검색(Spotify 카탈로그) | `/api/v1/playlist/catalog/tracks/search` | `useMusicSearch` | 1분 | — | `retry: false`. 429면 `Retry-After`만큼 검색 버튼을 막음(자동 재시도하면 제한이 더 길어짐) |

등록·신고·좋아요·재생수 기록·리액션 같은 `POST` 요청은 뮤테이션이라 캐싱 대상이 아닙니다.

### 표 읽는 법
- "백엔드 캐시" 열의 "—": 프론트 코드나 기존 문서에 근거가 없어 백엔드 쪽 확인이 필요한 칸입니다.
- "추가 갱신 시점" 열의 "—": staleTime 외에 따로 다시 받는 시점이 없다는 뜻입니다.

## 화면에 따라 요청을 멈추는 방식

- **탭이 안 보이면 요청하지 않습니다.** 탭 화면은 언마운트되지 않고 숨겨지기만 하므로, 훅이 `isActive`를 받아 `enabled`로 넘깁니다.
- **폴링은 조건부입니다.** 공공버스만 폴링하며, 화면이 백그라운드로 가거나(`visibilitychange`) 3분간 사용자 활동이 없으면 멈춥니다. 다른 탭으로 나갔다 돌아오면 자동 재개하지 않고 사용자의 터치를 기다립니다.
- **오프라인 감지**는 Capacitor Network 플러그인 기반(`infrastructure/network/NetworkStatus`)으로 `onlineManager`에 연결돼 있습니다. 오프라인일 땐 요청을 멈췄다가 복구되면 다시 보냅니다.

## TanStack Query 밖의 브라우저 저장소

서버 데이터가 아닌 값(사용자 선택, 부팅용 캐시 등)은 아래 키로 직접 저장합니다. 새 키를 추가하면 이 표에도 적습니다.

### localStorage

| 키 | 내용 | 언제 쓰나 |
|---|---|---|
| `hyu_rq_cache` | TanStack Query 캐시 영속화본 | 항상 |
| `period_schedule_cache` | Supabase `app_config.period_schedule`(다가오는 시간표 변경 배너용) | 부팅 시 조회 성공하면 덮어씀(TTL 없음) |
| `splashBannerCache` | 다음 부팅 스플래시에 띄울 배너 | 배너를 받아올 때마다 |
| `lastActiveTab` | 마지막으로 본 탭 | 탭 전환마다 |
| `shuttle_stop`, `shuttle_lineId` | 마지막으로 고른 셔틀 정류장·노선 | 사용자가 직접 바꿀 때만(GPS 자동 선택은 저장 안 함) |
| `public_bus_favorites` | 즐겨찾기한 버스 정류장 | 즐겨찾기 토글 시 |
| `alarm_settings`, `weather_alarm_settings` | 학식·날씨 알림 구독 설정 | 알림 바텀시트를 닫을 때 |
| `partnerCollegeFilter` | 마지막으로 고른 제휴 단과대 칩 | 단과대 칩을 누를 때 |
| `sb-<project>-auth-token` | Supabase 익명 로그인 세션(SDK가 관리) | 처음 로그인이 필요할 때. 네이티브는 Keychain/Keystore(`SecureStorage.ts`), 웹은 localStorage |
| `ph_phc_<프로젝트키>_posthog` | PostHog 기기 ID(SDK가 관리, 쿠키에도 저장) | PostHog 초기화 시 |

### sessionStorage

| 키 | 내용 |
|---|---|
| `splashShown` | 이번 세션에 스플래시를 이미 보여줬는지(세션당 1회) |
| `vite_preload_error_reloaded` | 배포 직후 옛 청크 로드 실패로 자동 새로고침을 이미 했는지(무한 새로고침 방지) |

### 메모리

| 변수 | 내용 |
|---|---|
| `cachedNativeToken` (`lib/firebase.ts`) | 네이티브 FCM 토큰. 세션 안에서 재사용하고 디스크엔 저장하지 않음 |
