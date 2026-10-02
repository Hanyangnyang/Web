# 플레이리스트 "최근 추가된 곡" 재생 인터랙션 A/B 테스트

정리일: 2026-09-03. `feat/erica-playlist-two`(로컬, 이하 **A안**)와 `origin/feat/erica-playlist-two-b`(원격, 이하 **B안**, 로컬 대비 커밋 2개 추가: `8a710a7`, `baaa1b4`)가 "최근 추가된 곡" 재생 방식을 두고 서로 다른 UI로 갈라진 상태. 두 UI 차이와 개발자 두 명의 의견 차이, 그리고 이를 검증하기 위한 측정 지표를 실험 코드 작성 전에 기록해둔다. 아직 실험 배정/계측 코드는 없음 — 다음 단계에서 작성 예정.

## UI 차이

### ① 홈 화면 > 최근 추가된 곡 미리보기 행 — [RecentSongRow.tsx](../src/presentation/components/playlist/shared/RecentSongRow.tsx)

| | A안 (로컬) | B안 (원격) |
|---|---|---|
| 앨범커버 클릭 | 재생 | 재생 |
| 앨범커버 위 재생 아이콘 | 항상 표시(재생 중엔 일시정지 아이콘) | **재생 중일 때만** 표시, 평소엔 숨김 |
| 곡 정보 영역(제목·가수·한마디) 클릭 | 최근 추가된 곡 화면으로 이동 | **재생** (앨범커버와 동일 동작) |
| 최근 추가된 곡 화면 이동 | 앨범커버 제외 전체 | 오른쪽 끝 화살표(`>`)만 |
| 눌림 피드백 | 각 버튼 개별 | 재생 영역(커버+정보) 전체에 통일된 눌림 오버레이 |

### ② 최근 추가된 곡 전체보기 화면의 카드 — [PostDetailCard.tsx](../src/presentation/components/playlist/shared/PostDetailCard.tsx) (그리드/리스트 공용, [SongListScreen.tsx](../src/presentation/components/playlist/shared/SongListScreen.tsx)에서 렌더링)

| | A안 (로컬) | B안 (원격) |
|---|---|---|
| 재생 버튼 위치 | 앨범커버 **정중앙** 원형 버튼([AlbumArtPlayButton.tsx](../src/presentation/components/playlist/shared/AlbumArtPlayButton.tsx)) | 앨범커버 **우측 상단** 작은 배지 |
| 재생 버튼 히트 영역 | 카드 폭 대비 16~22%로 계산된 원(`playButtonSizeClass`) | 앨범커버 **전체 영역**이 재생 버튼(우측 상단 배지는 상태 표시 겸 보조 버튼) |
| 재생 미표시 시 아이콘 | 항상 표시 | 재생 중일 때만 일시정지 아이콘 표시 |

두 브랜치 사이엔 이 외에도 홈 "더보기" 버튼의 스크롤 동작 차이가 있었지만, 이건 디자인 의견 차이가 아니라 A안이 놓치고 있던 로직(B안에서 먼저 고쳐짐)이라 A/B 테스트 대상이 아니고, variant와 무관하게 두 안 모두에 공통 적용해뒀다 — 이 문서는 실제 A/B 테스트 대상인 ①②(재생 인터랙션)만 다룬다.

## 의견 차이 — 두 가설

**가설 A (로컬 작성자)**: 앨범커버 = 재생, 나머지 = 이동이라는 역할 구분이 명확해야 자연스럽다. 앨범커버 위에 재생 버튼이 보이니 흐름상 그것만 누르면 되고, 나머지를 누르면 최근 추가된 곡 화면으로 넘어가는 게 맥락적으로 당연하다. 사용자가 정보 영역(제목·가수·한마디)을 누르는 건 대부분 "더 자세히 보고 싶어서" 또는 "반응을 남기고 싶어서"이지 재생하려는 의도가 아니므로, 그 의도에 맞게 최근 추가된 곡 화면으로 보내주는 게 맞다. 반대로 B안처럼 홈에서 이미 모든 곡을 재생할 수 있게 열어두면, 사용자가 최근 추가된 곡 화면에 굳이 들어갈 이유가 줄어 체류시간이 줄어들 수 있다. 또한 전체보기 화면에서 재생 버튼이 정중앙이 아니라 우측 상단 작은 배지로 가면(특히 1열 리스트에서 카드가 넓어질수록) 눈에 잘 안 띄어 클릭률이 낮을 수 있다. B안이 우려하는 "오른손잡이라 재생 버튼까지 손이 안 간다"는 문제도, 설령 정보 영역을 눌러 최근 추가된 곡 화면으로 넘어가더라도 그 화면 1열 리스트 맨 위 카드에 바로 앨범아트+정중앙 재생 버튼이 있어 어차피 그걸 누르면 되므로 실질적인 재생 편의성 손실은 크지 않다고 본다 — 화면 전환 한 단계만 더 거칠 뿐이다.

**가설 B (원격 작성자)**: 사용자가 음악을 더 쉽고 빠르게 재생할 수 있어야 한다는 것이 우선이다. 탭 가능 영역을 최대한 넓히면(앨범커버+텍스트 전체) 재생까지의 마찰이 줄어든다. UX는 사용자의 경험적 학습으로 익숙해질 수 있다고 보며, 앨범커버를 가리고 싶지 않아 재생 버튼을 최소화하거나 우측 상단으로 뺐다. 재생 버튼이 앨범커버 위 + 화면 곳곳에 계속 떠 있으면 시각적으로 지저분해 보이고, 대부분 사용자가 오른손잡이라 왼쪽 앨범커버까지 엄지를 뻗기 번거로워서 실제로 잘 안 누르게 된다는 점도 고려했다. 한마디 감상평이 대부분 한 줄로 짧게 끝나서 굳이 세부 화면(최근 추가된 곡 전체보기)까지 들여다볼 필요가 딱히 없는 경우가 많고, 그래도 자세히 보고 싶은 사용자를 위한 경로(오른쪽 화살표 `>`, 헤더의 "최근 추가된 곡 →", "더보기" 버튼)는 이미 충분히 있다고 판단했다.

→ 두 가설은 상충 관계에 있다. B안이 재생 수를 늘려도 A안이 우려한 대로 전체보기 진입·체류·후속 탐색이 줄어들 수 있고, 반대로 A안이 체류시간을 지켜도 재생 자체는 덜 늘 수 있다. 따라서 "재생 지표"와 "탐색 지표"를 페어로 놓고 트레이드오프를 확인해야 한다.

## 측정 지표

가설 A와 B는 서로 다른 차원(재생 행동 vs 탐색/체류 행동)에서 반대 효과를 예측한다. 이 둘을 억지로 지표 하나에 뭉쳐버리면 두 효과가 서로 상쇄돼 "변화 없음"으로 잘못 보일 수 있다. 그래서 **승패를 가르는 지표(Primary)를 명시적으로 정하고, 나머지는 그 승리에 부작용이 없는지 확인하는 가드레일 / 왜 그런 결과가 나왔는지 설명하는 진단 지표**로 역할을 나눈다. 다만 재생 편의성과 달리 "최근 추가된 곡 화면에 머물렀으면 좋겠다"는 건 두 사람이 공유하는 목표라, Primary를 하나가 아니라 두 개로 둔다.

### Primary metrics — 이 두 지표로 A안/B안 승패를 판단한다

1. **세션당 3초 이상 지속된 재생 수** (`playlist_recent_song_play_sustained`, 홈 프리뷰+전체보기 표면 합산) — 오탭(스크롤 중 실수 탭)을 걸러낸 실질 재생량
2. **최근 추가된 곡 화면 체류시간** (중앙값 — 평균은 이상치에 취약)

**승패 판단 규칙**
- 두 지표 다 개선되거나, 하나가 개선되고 나머지는 유의미하게 나빠지지 않았다 → 그 안 채택
- 하나는 늘고 하나는 유의미하게 줄어드는 진짜 트레이드오프가 나오면 → 수치만으로 자동 채택하지 않고 팀이 직접 판단한다 (이건 이 실험이 원래 풀려고 했던 문제가 그대로 재발한 상황이라, 그때 가서 "재생이 몇 % 늘면 체류시간이 몇 % 줄어드는 건 감수한다" 같은 임계값을 팀이 합의해야 함 — 지금은 미리 정해두지 않음)

### Guardrail — 위 두 Primary 외에 크게 나빠지면 채택을 보류한다

- 홈 → 최근 추가된 곡 화면 진입 CTR (클릭 수 / 홈 노출 수)
- 홈 화면 체류시간
- 플레이리스트 탭 진입 후 조기 이탈률(다른 탭으로 N초 내 이동) — 두 안 모두 악화시킬 수 있는 공통 리스크

### 진단 지표 — 승패엔 안 쓰지만 Primary가 왜 그렇게 나왔는지 설명할 때 씀

- 표면별 재생 시작 횟수(홈 프리뷰 vs 전체보기) — Primary가 움직였을 때 어느 표면에서 늘었는지 원인 파악
- 사용자당 재생한 고유 곡 수 — 같은 곡 반복이 아니라 실제로 더 다양한 곡을 듣는지
- 최근 추가된 곡 화면에서의 스크롤 깊이 / 노출된 카드 수 — 체류시간만으로는 "딴짓하다 오래 켜놓음"과 "실제로 훑어봄"이 구분 안 됨
- 최근 추가된 곡 화면 → 게시글 상세(곡 한마디/리액션) 진입율, 리액션·북마크·공유 비율 — "곡 한마디가 안 궁금할 것 같다"는 가설을 직접 검증. B안에서 이게 눈에 띄게 줄면 가설 A 쪽 우려가 맞았다는 근거
- 최근 추가된 곡 화면 카드의 재생 버튼 클릭률(클릭 수 / 카드 노출 수) — 정중앙 vs 우측 상단 위치 효과. **그리드(2열)/리스트(1열) 뷰모드로 반드시 분리** — "1열일 때 우측 상단이 안 보일 것 같다"는 우려가 뷰모드 특화 이슈라, 합쳐서 보면 효과가 희석돼 안 보일 수 있음 ([SongListScreen.tsx](../src/presentation/components/playlist/shared/SongListScreen.tsx)의 `viewMode` 값을 세그먼트로 같이 기록)
- `>` 이동 버튼 오탭/재탭 비율 — 이동 버튼 히트 영역이 40px(`w-10`)로 줄어드는 만큼, 놓쳐서 여러 번 누르거나 의도와 다르게 재생이 눌리는 경우가 늘 수 있음 (PostHog rage click/dead click 자동 감지 활용 가능)

### 세그먼트

- 그리드/리스트 뷰모드 (필수)
- 최초 방문자 vs N회 이상 방문자 — 가설 B의 "학습되면 익숙해진다"는 코호트가 쌓일수록 재생 클릭률이 오르는지 시계열로 봐야 검증됨

## 구현 현황 (2026-09-03)

실험 배정 코드와 캡처 이벤트를 심어뒀다. UI 변형은 순수 프레젠테이션 prop(`variant`/`playButtonVariant`)으로만 분기하고, 캡처는 `PlaylistView.tsx`(허브 컴포넌트) 한 곳에 모아뒀다 — `RecentSongRow`/`PostDetailCard`/`SongListScreen`은 실험 로직을 모르는 순수 컴포넌트로 남겨서, 다른 화면(게시글 상세·게시글 모음·저장한 곡 등)에 실수로 실험이 새어나가지 않게 함.

### 실험 배정

- [usePlaylistExperiment.ts](../src/presentation/hooks/playlist/usePlaylistExperiment.ts) — `useFeatureFlagVariantKey('playlist-recent-songs-tap-area')`. **PostHog 대시보드에 이 키로 Feature Flag(Experiment)를 아직 안 만들었으면 전원 항상 `control`(현재 로컬 UI)로만 보임** — 대시보드에서 flag를 만들고 `test` variant 배정 비율을 설정해야 실제로 B안이 노출되기 시작한다.
- 배정값은 [PlaylistView.tsx](../src/presentation/components/playlist/PlaylistView.tsx)에서 한 번만 조회해 `RecentSongRow`(홈 미리보기)와 `PostDetailCard`(전체보기 카드)에 각각 prop으로 흘려보냄. 다른 화면에서 쓰는 `PostDetailCard`(게시글 상세/게시글 모음/저장한 곡/내가 등록한 곡)는 이 prop을 안 받아서 항상 control 그대로.
- "더보기" 스크롤 이어보기는 A안이 놓쳤던 로직일 뿐 A/B 테스트 대상이 아니라, flag와 무관하게 항상 켜짐(무조건 병합).

### environment 태깅

[main.tsx](../src/main.tsx) `posthog.init()` 직후 `posthog.register({ environment: import.meta.env.MODE })`를 호출해서, 이후 모든 이벤트(이 실험 이벤트 포함)에 `environment: 'development' | 'production'`이 자동으로 붙는다. Sentry(`enabled: import.meta.env.PROD`)처럼 dev에서 아예 안 보내는 대신, dev에서도 계속 보내되(로컬에서 이벤트를 한 번 발생시켜야 PostHog 지표 선택창에 뜨기 때문) 태그로 구분하는 방식을 택함. **주의: 태깅만으로는 자동으로 안 걸러짐** — Experiment 설정에서 지표 필터에 `environment = production`(또는 `!= development`)을 직접 추가해야 로컬 테스트 이벤트가 실제 결과 계산에서 빠진다.

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
- **스크롤 깊이 / 노출된 카드 수**, **게시글 상세·리액션·북마크·공유 전환**, **`>` 버튼 오탭/재탭(rage click)**(모두 진단 지표): PostHog autocapture + 세션 리플레이로 우선 확인해보고, 신호가 애매하면 그때 수동 계측 추가
- **그리드/리스트 뷰모드 세그먼트**: `playlist_recent_song_play`(`recent_full_list`)에 `view_mode`를 아직 안 붙임 — 필요해지면 `handlePlay` 호출부에 `recentViewMode` 추가
- **최초 방문자 vs N회 방문자 코호트**: 별도 계측 없이 PostHog 유저 프로퍼티/코호트 기능으로 분석 단계에서 처리

### 대시보드에서 할 일

1. PostHog → Feature Flags → `playlist-recent-songs-tap-area` 생성, variant `control`/`test` 50:50
2. Experiments 탭에서 `playlist_recent_song_play_sustained`를 목표(goal) 지표로, `playlist_screen_dwell`(`screen: 'recent'`)을 보조(secondary) 지표로 등록 — PostHog Experiments UI는 목표 지표를 하나만 받아서, Primary 두 개 중 하나를 goal로 걸고 나머지는 secondary로 같이 모니터링한다. **최종 승패 판단은 대시보드가 자동으로 내리는 게 아니라, 아래 4번 규칙을 팀이 직접 적용**한다.
3. 등록한 goal/secondary 지표 필터에 `environment = production` 조건을 추가해서 로컬 개발 중 발생한 이벤트를 결과 계산에서 제외 (위 "environment 태깅" 참고)
4. 표본이 쌓이면 먼저 Guardrail이 크게 나빠지지 않았는지 확인 → 두 Primary(지속 재생 수, 최근 추가된 곡 화면 체류시간)를 같이 봄: 둘 다 개선/한쪽만 개선+나머지 무손상이면 채택, 진짜 트레이드오프면 자동 채택하지 않고 팀 논의 — 진단 지표는 그 논의에서 원인 해석용으로 참고
