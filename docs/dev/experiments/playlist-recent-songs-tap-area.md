# 플레이리스트 "최근 추가된 곡" A/B 테스트 — 구현

실험 배정 코드, 캡처 이벤트, PostHog 대시보드 설정을 적습니다. 가설·지표 정의·판단 규칙은 private 레포 `Hanyangnyang/Context`의 `context/insights/experiments/2026-09_playlist-recent-songs-tap-area.md`에 있습니다.

- 실험 키: `playlist-recent-songs-tap-area`
- 원본: `docs/playlist-recent-songs-ab-test.md`에서 구현 부분만 옮김 (2026-11-07)

## 구현 현황 (2026-09-03)

실험 배정 코드와 캡처 이벤트를 심어뒀다. UI 변형은 순수 프레젠테이션 prop(`variant`/`playButtonVariant`)으로만 분기하고, 캡처는 `PlaylistView.tsx`(허브 컴포넌트) 한 곳에 모아뒀다 — `RecentSongRow`/`PostDetailCard`/`SongListScreen`은 실험 로직을 모르는 순수 컴포넌트로 남겨서, 다른 화면(게시글 상세·게시글 모음·저장한 곡 등)에 실수로 실험이 새어나가지 않게 함.

### 실험 배정

- [usePlaylistExperiment.ts](../../../src/presentation/hooks/playlist/usePlaylistExperiment.ts) — `useFeatureFlagVariantKey('playlist-recent-songs-tap-area')`. **PostHog 대시보드에 이 키로 Feature Flag(Experiment)를 아직 안 만들었으면 전원 항상 `control`(현재 로컬 UI)로만 보임** — 대시보드에서 flag를 만들고 `test` variant 배정 비율을 설정해야 실제로 B안이 노출되기 시작한다.
- 배정값은 [PlaylistView.tsx](../../../src/presentation/components/playlist/PlaylistView.tsx)에서 한 번만 조회해 `RecentSongRow`(홈 미리보기)와 `PostDetailCard`(전체보기 카드)에 각각 prop으로 흘려보냄. 다른 화면에서 쓰는 `PostDetailCard`(게시글 상세/게시글 모음/저장한 곡/내가 등록한 곡)는 이 prop을 안 받아서 항상 control 그대로.
- "더보기" 스크롤 이어보기는 A안이 놓쳤던 로직일 뿐 A/B 테스트 대상이 아니라, flag와 무관하게 항상 켜짐(무조건 병합).

### environment 태깅

[main.tsx](../../../src/main.tsx) `posthog.init()` 직후 `posthog.register({ environment: import.meta.env.MODE })`를 호출해서, 이후 모든 이벤트(이 실험 이벤트 포함)에 `environment: 'development' | 'production'`이 자동으로 붙는다. Sentry(`enabled: import.meta.env.PROD`)처럼 dev에서 아예 안 보내는 대신, dev에서도 계속 보내되(로컬에서 이벤트를 한 번 발생시켜야 PostHog 지표 선택창에 뜨기 때문) 태그로 구분하는 방식을 택함. **주의: 태깅만으로는 자동으로 안 걸러짐** — Experiment 설정에서 지표 필터에 `environment = production`(또는 `!= development`)을 직접 추가해야 로컬 테스트 이벤트가 실제 결과 계산에서 빠진다.

### 캡처 이벤트 (모두 `variant` 프로퍼티 포함)

| 이벤트 | 위치 | 대응 지표 |
|---|---|---|
| `playlist_recent_song_play_sustained` | `PlaylistView.handlePlay`, 재생 3초 이상 지속 시 지연 발화 (`surface: 'home_preview' \| 'recent_full_list'`) | **Primary ①** — 지속 재생 수 |
| `playlist_screen_dwell` (`screen: 'recent'`) | `PlaylistView`의 화면 전환 effect + 언마운트 클린업 (`duration_ms`, `view_mode` 포함) | **Primary ②** — 최근 추가된 곡 화면 체류시간 |
| `playlist_recent_song_play` | `PlaylistView.handlePlay`, 재생 시작 시점 | 진단 — 표면별 재생 시작 횟수 |
| `playlist_recent_preview_navigate` | `PlaylistView.handleSelectRecentSong` | Guardrail — 홈 → 전체보기 진입 |
| `playlist_recent_show_all_clicked` | `PlaylistView.handleShowAllRecent` (`trigger: 'header_arrow' \| 'more_button'`) | Guardrail — 홈 → 전체보기 진입 CTR |
| `playlist_screen_dwell` (`screen: 'main'`) | 동일 위치 | Guardrail — 홈 화면 체류시간 |

### 아직 안 한 것 (남은 지표는 코드 계측만으로는 부족하거나 후순위)

- **CTR의 분모(노출 수)**: 카드 임프레션은 계측 안 함 — PostHog에서 스크린뷰/세션 수 대비 비율로 근사하거나, 필요해지면 IntersectionObserver로 별도 추가
- **스크롤 깊이 / 노출된 카드 수**, **게시글 상세·리액션·좋아요·공유 전환**, **`>` 버튼 오탭/재탭(rage click)**(모두 진단 지표): PostHog autocapture + 세션 리플레이로 우선 확인해보고, 신호가 애매하면 그때 수동 계측 추가
- **그리드/리스트 뷰모드 세그먼트**: `playlist_recent_song_play`(`recent_full_list`)에 `view_mode`를 아직 안 붙임 — 필요해지면 `handlePlay` 호출부에 `recentViewMode` 추가
- **최초 방문자 vs N회 방문자 코호트**: 별도 계측 없이 PostHog 유저 프로퍼티/코호트 기능으로 분석 단계에서 처리

### 대시보드에서 할 일

1. PostHog → Feature Flags → `playlist-recent-songs-tap-area` 생성, variant `control`/`test` 50:50
2. Experiments 탭에서 `playlist_recent_song_play_sustained`를 목표(goal) 지표로, `playlist_screen_dwell`(`screen: 'recent'`)을 보조(secondary) 지표로 등록 — PostHog Experiments UI는 목표 지표를 하나만 받아서, Primary 두 개 중 하나를 goal로 걸고 나머지는 secondary로 같이 모니터링한다. **최종 승패 판단은 대시보드가 자동으로 내리는 게 아니라, Context 레포의 판단 규칙을 팀이 직접 적용**한다.
3. 등록한 goal/secondary 지표 필터에 `environment = production` 조건을 추가해서 로컬 개발 중 발생한 이벤트를 결과 계산에서 제외 (위 "environment 태깅" 참고)
4. 표본이 쌓이면 먼저 Guardrail이 크게 나빠지지 않았는지 확인 → 두 Primary(지속 재생 수, 최근 추가된 곡 화면 체류시간)를 같이 봄: 둘 다 개선/한쪽만 개선+나머지 무손상이면 채택, 진짜 트레이드오프면 자동 채택하지 않고 팀 논의 — 진단 지표는 그 논의에서 원인 해석용으로 참고
