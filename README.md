<p align="center">
  <img src="./assets/icon.png" alt="하냥냥 로고" width="120" />
</p>

<h1 align="center">😸 하냥냥</h1>

<p align="center">
  한양대학교 ERICA인들을 위한 캠퍼스 라이프스타일 유틸리티 앱<br/>
  학식 · 셔틀버스 · 캠퍼스맵 · 도서관 혼잡도 · 헬스장 시간표 등<br/>
  매일 확인해야 하는 캠퍼스 정보를 한곳에 모아 더 슬기로운 에리카 캠퍼스 라이프를 즐겨보세요!
</p>

<p align="center">
  <a href="https://www.hanyang.life/"><img src="https://img.shields.io/badge/Website-hanyang.life-1B5FA8" alt="Website" /></a>
  <a href="https://apps.apple.com/kr/app/하냥냥/id6770033067"><img src="https://img.shields.io/badge/App%20Store-다운로드-0D96F6?logo=apple&logoColor=white" alt="App Store" /></a>
  <a href="https://play.google.com/store/apps/details?id=com.hanyangnyang.app"><img src="https://img.shields.io/badge/Google%20Play-다운로드-414141?logo=googleplay&logoColor=white" alt="Google Play" /></a>
</p>

---

#### 👥 개발자

| 역할 | 이름 | GitHub | Email |
|---|---|---|---|
| 프론트엔드 | 김예은 | [@yaeunjess](https://github.com/yaeunjess) | manlcoff@hanyang.ac.kr |
| 백엔드 | 김동준 | [@kdjidkr](https://github.com/kdjidkr) | kdjidkr@hanyang.ac.kr |

문의사항이 있다면 **hanyangnyang01@gmail.com** 으로 연락주세요 :)

---

## ✨ 주요 기능

- 🍚 식당별 학식 조회 
- 🚌 셔틀버스&지하철와 공공버스 시간표 
- ☁️ 날씨와 학정혼잡도 
- 🏫 교내건물&흡연시설&오픈스페이스와 단과대별 제휴업체를 모은 캠퍼스맵
- 🔔 학식·날씨 맞춤 푸시알림 (FCM)
- 💪 체대 헬스장 시간표 조회
- 🎓 그외 편리한 학교생활을 위한 기타기능
> 💡 원래는 도서관 열람실 입장용 QR 코드 발급 + 좌석 예약/반납 기능도 준비했었는데, 학교 도서관 측에 문의해보니 외부 앱에서 제공하면 안 된다고 해서 접었어요..ㅎㅎ

---

## 🛠 기술 스택

**Frontend**

![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Capacitor](https://img.shields.io/badge/Capacitor-119EFF?style=for-the-badge&logo=capacitor&logoColor=white)
![Android](https://img.shields.io/badge/Android-3DDC84?style=for-the-badge&logo=android&logoColor=white)
![iOS](https://img.shields.io/badge/iOS-000000?style=for-the-badge&logo=apple&logoColor=white)

**Backend**

![Spring Boot](https://img.shields.io/badge/Spring_Boot-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)
![Java](https://img.shields.io/badge/Java_17-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

**Data & Infra** - Supabase는 익명 Auth·DB·RPC, Firebase는 FCM 푸시 알림(네이티브 + Web)을 담당

![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)

**Testing & Monitoring**

![Playwright](https://img.shields.io/badge/Playwright-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)
![Storybook](https://img.shields.io/badge/Storybook-FF4785?style=for-the-badge&logo=storybook&logoColor=white)
![Sentry](https://img.shields.io/badge/Sentry-362D59?style=for-the-badge&logo=sentry&logoColor=white)
![PostHog](https://img.shields.io/badge/PostHog-000000?style=for-the-badge&logo=posthog&logoColor=white)

**외부 API**: Open-Meteo(날씨·대기질), 서울열린데이터(지하철), 공공데이터포털(공휴일), 경기도 버스정보시스템(공공버스), 한양대도서관 API, Google Gemini(날씨 코멘트 AI), Instagram API

---

## 📁 폴더 구조 - Clean Architecture

**Clean Architecture**는 소스 코드 의존성이 항상 바깥(UI·프레임워크·DB)에서 안쪽(비즈니스 로직)을 향하게 강제해 프레임워크·DB·외부 API가 바뀌어도 핵심 로직은 영향받지 않게 하는 것이 핵심이다.

| 원칙 | 하냥냥에서의 적용 |
|---|---|
| **의존성 규칙** — 바깥 레이어만 안쪽을 알아야 함 | `domain/`은 React·Supabase·fetch 등 어떤 프레임워크도 import하지 않고, `data/`·`presentation/`이 반대로 `domain/`을 참조 |
| **의존성 역전(DIP)** — 저수준 구현이 고수준 정책의 인터페이스를 구현 | `domain/repositories/`에 인터페이스만 정의하고 실제 구현체(`data/repositories/`)가 이를 구현 — domain은 API가 REST인지, 응답 DTO가 어떤 모양인지 전혀 모름 |
| **프레임워크 독립성** | `domain/entities`·`usecases`는 순수 TS 타입·함수뿐이라 React 없이도 재사용·테스트 가능 |
| **테스트 용이성** | domain 레이어 로직(`Weather.test.ts`, `Shuttle.test.ts` 등)을 목(mock) 없이 순수 함수 단위로 테스트 |
| **Composition Root** | `di.ts`에서만 datasource→repository→usecase의 구체 구현을 실제로 조립해 훅에 주입 |

```
src/
├── presentation/            # UI (React 컴포넌트, Hook, Context)
│   ├── components/              # 화면 단위 컴포넌트 — 하단 탭 구조와 1:1 대응하도록 폴더를 분리
│   │   ├── cafeteria/               # 학식 탭 — 화면 + 메뉴 포맷팅/끼니별 그룹핑 로직
│   │   ├── portal/                  # 소식 탭 — 날씨·도서관 좌석·배너를 한 화면에 모음
│   │   ├── shuttle/                 # 셔틀 탭 — 셔틀·지하철·공공버스 시간표/도착정보
│   │   ├── misc/                    # 기타 탭 — 헬스장·인스타·피드백
│   │   ├── partnership/             # 단과대별 제휴 정보 탭
│   │   ├── common/                  # 특정 탭에 속하지 않는 전역 UI (스플래시, 에러 바운더리, 오프라인 모달 등)
│   │   └── ui/                      # 범용 UI 프리미티브 (아코디언·바텀시트·휠피커 등)
│   ├── context/                  # 앱 전체가 공유해야 하는 상태 (부팅 준비 상태, 네트워크 온/오프라인)
│   └── hooks/                    # 화면별 데이터 조회·폴링·구독 로직 
├── domain/                  # 비즈니스 로직 
│   ├── entities/                 # 도메인 모델 타입 + 그에 딸린 순수 계산/변환 로직 
│   ├── repositories/             # 레포지토리 "인터페이스"만 정의 
│   ├── usecases/                 # 화면이 호출하는 단일 진입점 
│   └── utils/                    # 여러 도메인이 공유하는 프레임워크 독립 순수 함수 (예: 좌표 거리 계산)
├── data/                    # 데이터 레이어
│   ├── datasources/              # 실제 HTTP 요청을 실행하고 백엔드 원시 응답(DTO) 타입만 다룸 
│   └── repositories/             # domain의 레포지토리 인터페이스를 구현
├── infrastructure/          # 플랫폼 종속 계층
│   ├── http/HttpClient.ts        # HttpClient 인터페이스, ApiResponse<T> 응답 래퍼, parseOrThrow
│   ├── network/NetworkStatus.ts  # 네이티브/웹 온라인 상태 조회 및 구독
│   └── storage/SecureStorage.ts  # 네이티브 보안저장소·localStorage 겸용 Supabase storage 어댑터
├── lib/                     # 외부 SDK 초기화
│   ├── supabase.ts               # Supabase 클라이언트 생성, 하이브리드 storage, 익명 사용자 ID 발급
│   ├── firebase.ts               # Firebase 초기화, 웹/네이티브 FCM 권한 요청·토큰 발급
│   ├── sentry.ts                 # Sentry 지연 로드 및 1회 init 캐싱
│   ├── queryClient.ts            # QueryClient 기본옵션 + persistQueryClient 설정
│   ├── kakao.ts                  # 카카오 공유 SDK 지연 로딩 및 1회 초기화 캐싱
│   ├── platform.ts               # Capacitor 기반 플랫폼(ios/android/web) 판별 헬퍼
│   └── androidBackHandler.ts     # 안드로이드 뒤로가기 콜백 스택 관리
└── di.ts                    # 위 모든 데이터소스·레포지토리·유스케이스를 조립해 훅에 주입하는 컨테이너
```

---

## 🔌서드파티와 💾캐싱정책

학식·날씨·도서관 혼잡도·배너·지하철·셔틀·학사달력/공휴일·통합피드백 등 핵심 데이터는 자체 **백엔드 서버**(`api.hanyang.life`, Spring Boot)를 거치고, 인스타그램 프로필·공공버스 조회는 **Vercel BFF**(Serverless Functions)를 경유합니다. 앱이 외부 API를 직접 호출하는 경우는 거의 없습니다.
**Supabase**는 익명 Auth·앱설정(다가오는 시간표 변경 배너용 `period_schedule`만)·알림구독 RPC 목적으로 클라이언트에서 직접 연결합니다.
푸시 알림은 **Firebase Cloud** Messaging(FCM)으로 발송되며, iOS 빌드·배포는 Codemagic으로 자동화되어 있습니다.

### Supabase 테이블 - Supabase 로그인 되면 수정해야함

| 테이블 | 용도 |
|--------|------|
| `app_config` | 다가오는 시간표 변경 배너용 `period_schedule`만 조회 — 현재기간·공휴일·강제주말·미운행 오버라이드 등 나머지 필드는 `/api/v1/academic/status`로 이전 완료, 더 이상 조회 안 함 |

`devices`(FCM 토큰), `subscriptions`(알림 구독 설정) 테이블은 클라이언트에서 직접 조회하지 않고 RPC로만 접근합니다 — `get_alarm_subscription`(구독 조회), `upsert_alarm_subscription`(구독 생성·수정·해제)


### 백엔드 서버 API 엔드포인트 (`https://api.hanyang.life`) + 💾TanStack Query + localStorage
(Tanstack Query 기본값은 staleTime 15분, gcTime 24시간을 씀. api 실패시 재시도는 2번, 그래서 총 3번 호출함. staleTime이 지났는데 트리거가 있을 경우 SWR. localStorage는 maxAge 24시간으로 설정함. maxAge는 캐싱된 값을 불러올지 말지를 결정하는 기준.)

| 엔드포인트 | 역할 | Redis TTL(백엔드) / TanStackQuery staleTime(FE) | refetch 트리거 (네트워크 재연결시 staleTime 기준으로 다시 불러옴) |
|---|---|---|---|
| `/api/v1/menu` | 학식 메뉴 조회 | 12시간 / 1시간 | 콜드스타트 fetch, "다시 시도" 버튼 |
| `/api/v1/shuttle` | 셔틀버스 시간표 조회 | 12시간 / 1시간 | 콜드스타트 prefetch, "다시 시도" 버튼, **academic/status 기간/dayType이 실제로 바뀌는 순간 강제 재요청**(`useShuttle`이 이전 값과 비교해 `invalidateQueries`). academic/status 자체는 셔틀화면이 열릴 때 낡았으면 재검증 + 화면이 켜져있는 동안만 10초마다 KST 날짜 확인해서 자정 넘으면 재요청 — 화면을 계속 띄워둔 채로 자정을 넘겨도(예: 11:50pm부터 보고 있다가) 뱃지(학기중/평일)가 자동으로 갱신됨 |
| `/api/v1/subway/schedule` | 지하철 시간표 조회 | 12시간 / 1시간 | 지하철정보가 필요한 정류장(기숙사·셔틀콕) 선택시, "다시 시도" 버튼, **date-info의 dayType이 바뀌는 순간 강제 재요청**(위와 동일한 이유) |
| `/api/v1/weather` | 날씨·대기질·자외선 스냅샷, 시간별 예보 | 10분 / 10분 | 콜드스타트 prefetch, 소식탭 진입, "다시 시도" 버튼 |
| `/api/v1/weather/briefing` | AI 기반 날씨 브리핑 | 30분(매시 22분 갱신) / 30분 | 콜드스타트 prefetch, 소식탭 진입 |
| `/api/v1/banners` | 홈 배너 조회 | 12시간 / 1시간 | 콜드스타트 prefetch |

배너 `clickUrl`이 `https://www.hanyang.life/?tab=<cafe\|shuttle\|portal\|partner\|misc>` 형태로 우리 도메인 + `tab` 파라미터를 가리키면, 새 창을 열지 않고 앱 내부에서 바로 그 탭으로 전환됩니다(`BannerCarousel.tsx`) — SPA라 페이지 경로가 하나뿐이라, 카카오 딥링크·푸시알림과 동일한 `?tab=` 쿼리 컨벤션을 재사용한 것. 그 외(다른 도메인 등)는 기존처럼 `window.open`으로 외부 링크 취급.
**⚠️ 반드시 `www.hanyang.life`로 입력할 것** — `BannerCarousel.tsx`의 판정 로직이 `url.origin === window.location.origin`으로 완전 일치를 요구하는데, `capacitor.config.json`의 `server.url`이 `https://www.hanyang.life`라 앱이 실제로 로딩되는 origin이 `www.` 포함이다. `www.` 없이 `https://hanyang.life/?tab=partner`로 주면 origin이 안 맞아 판정에 실패하고, 그냥 `window.open`으로 새 창이 열려버린다(내부 탭 전환 안 됨).
| `/api/v1/library/seats` | 도서관 열람실 좌석 혼잡도 | 3분 / 3분 | 콜드스타트 prefetch, 소식탭 진입, "다시 시도" 버튼 |
| `/api/v1/gym/gym-periods` | 체대 헬스장 운영기간·시간표 조회 | 12시간 / 1시간 | 헬스장 화면 진입시, "다시 시도" 버튼, **KST 날짜(자정)가 바뀌는 순간 강제 재요청**(`useGymSchedule`이 1분마다 날짜 확인). 셔틀과 달리 academic/status를 안 쓰고 `GymPeriod.startDate/endDate`로 직접 오늘과 비교해 기간을 고르는 구조라, "기간이 바뀌는 순간"이 아니라 "날짜가 바뀌는 순간"을 감지함. `GymView`도 자동판별을 매 gymData 갱신마다 다시 하도록 고쳐서(예전엔 최초 1회만) 화면을 계속 띄워놓은 채로 날짜가 바뀌어도 새 기간으로 따라감(사용자가 드롭다운으로 직접 고른 뒤엔 안 덮어씀) |
| `/api/v1/partnership/partnership-available` | 단과대별 제휴 가맹점·혜택 조회 | 12시간 / 1시간 | 캠퍼스맵 탭 최초 진입시 호출, "다시 시도" 버튼 |
| `POST /api/v1/feedbacks` | 통합 피드백 접수 | 해당없음 | 기타탭 > 피드백 보내기(category `GENERAL`), 캠퍼스맵 화면 상단에 제보 버튼(`CAMPUS_MAP`), 캠퍼스맵 검색 결과 없음 제보 버튼(`PARTNERSHIP`) |
| `/api/v1/academic/status` | 학사 및 셔틀/시설 통합 운영 상태 조회 | 5분(FE staleTime, BE 캐시 주기 미확인) | 앱부팅 시 `BootContext`가 prefetch(스플래시 게이팅 대상—실패해도 markReady는 호출) + 셔틀탭이 `academic`/`shuttle` 필드로 기간·셔틀 dayType·운행여부를 판정. `calendar` 필드는 학교 자체 공휴일까지 섞여 있어 지하철엔 안 씀(아래 date-info 참고) |
| `/api/v1/holidays/date-info` | 특정 날짜의 평일/주말/공휴일/미운행 상태 조회 | 1시간(FE staleTime, BE 캐시 주기 미확인) | 지하철 연결정보가 필요한 정류장에서만 조회 |
| `/api/v1/playlist/songs` | 플레이리스트 피드 곡 목록 조회 (최근추가된곡) | 0(항상 최신값) — 여러 사용자가 실시간으로 올리는 피드라 캐싱 안 함 | 콜드스타트 fetch, 최근추가된곡 화면 진입마다 |
| `/api/v1/playlist/songs/{id}` | 게시글(추천글) 단건 상세 조회 | 0(항상 최신값) | 게시글 목록(TrackPostCollectionView/SearchResultsView 등)에서 항목 클릭 시 상세화면(PostView) 진입 |
| `/api/v1/playlist/songs/creation-status` | 곡 작성 전 사용자 기기 상태 조회 (오늘 남은 등록 횟수, 최근 7일 중복 추천곡) | 0(항상 최신값) | 곡추천하기 화면 진입(컴포넌트 재마운트)마다. 헤더에 남은 횟수 표시, 최근 7일 내 추천한 곡은 검색 결과에서 선택 자체를 막음 |
| `/api/v1/playlist/songs/liked` | 내가 좋아요(=서비스 내 "저장") 누른 곡 목록 조회 | 0(항상 최신값) | 저장한 곡 화면 진입(컴포넌트 재마운트)마다 |
| `/api/v1/playlist/songs/my-songs` | 내가 등록(작성)한 추천글 목록 조회 | 0(항상 최신값) | 내가 등록한 곡 화면 진입(컴포넌트 재마운트)마다 |
| `/api/v1/playlist/songs/search` | 추천글 가중치 통합 검색 (제목/가수/코멘트) | 0(항상 최신값) | 검색 결과 화면의 "게시글" 섹션 — 검색어(query)가 바뀔 때마다(queryKey에 포함돼 자동 재조회), 2자 미만이면 호출 안 함 |
| `POST /api/v1/playlist/songs` | 곡 추천 및 등록 | 해당없음 (뮤테이션, 캐싱 대상 아님) | 등록 확인 팝업에서 최종 확정 시, 성공하면 위 목록 캐시 맨 앞에 즉시 반영. `isPending` 동안 버튼 비활성화로 중복 제출 방지 |
| `POST /api/v1/playlist/songs/{id}/reports` | 곡 게시글 신고하기 | 해당없음 (뮤테이션) | 더보기 메뉴 → 사유 선택 → 신고하기 클릭 시 |
| `POST /api/v1/playlist/songs/{id}/like` | 좋아요(=서비스 내 "저장") 토글 | 해당없음 (뮤테이션) | 저장 배지 클릭 시. 낙관적 업데이트 + 실패 시 롤백, 이전 요청 `isPending` 중엔 연타 무시 |
| `POST /api/v1/playlist/songs/tracks/{trackId}/play` | 곡 재생수 기록 (인기차트 집계용) | 해당없음 (뮤테이션) | 재생 버튼 클릭 시(모든 재생 버튼이 `PlaylistView`의 `handlePlay` 한 곳으로 모임). 같은 trackId는 10초 스로틀 — 연타로 재생수가 부풀지 않게 프론트에서 직접 제한 |
| `POST /api/v1/playlist/songs/{id}/reactions` | 이모지 리액션 토글 (9종) | 해당없음 (뮤테이션) | 이모지 반응 버튼 클릭 시. 응답으로 온 9종 전체 최신 카운트로 로컬 상태를 통째로 동기화, 실패 시 롤백, 이전 요청 `isPending` 중엔 연타 무시 |
| `/api/v1/playlist/songs/tracks/{trackId}` | 특정 곡(trackId)에 달린 추천 게시글 모아보기 | 0(항상 최신값) | 인기차트/검색결과에서 곡 선택 시, 최신·인기 정렬(sort) 전환 시(queryKey에 sort 포함돼 자동 재조회) |
| `/api/v1/playlist/songs/charts` | 인기 차트 순위 조회 (실시간 급상승/주간/월간) | 0(항상 최신값) | 콜드스타트 fetch, 기간 필터 칩(실시간/주간/월간) 전환 시(queryKey에 기간 포함돼 자동 재조회) |


### Vercel API 엔드포인트 + 💾TanStack Query + localStorage

| 엔드포인트 | 역할 | 외부 호출 대상 | Vercel 캐시 TTL | 프론트엔드 TanStackQuery staleTime | refetch 트리거 |
|---|---|---|---|---|---|
| `/api/cron/refresh-insta-profiles`* | 인스타 계정 프로필 사진 정적 이미지 갱신 | Instagram API(스크래핑) + GitHub Contents API(커밋) | 해당없음 | 해당없음 | Vercel Cron이 4개월마다 1회만 서버에서 실행, 클라이언트는 API 호출 안 하고 정적 이미지만 읽음 |
| `/api/bus` | 공공버스 도착 정보 조회 | 공공데이터포털-경기도 버스정보시스템 | 40초 (메모리 캐시) | 기본 15분 (화면 활성 중엔 30초 간격 강제 폴링, 탭 비활성·유휴 시 중단) | "공공버스" 모드 + 화면보임 + 사용자 조작중일 때 30초 간격 자동 폴링, 새로고침 버튼 수동 refetch |
| `/api/music-search` | Spotify 곡 검색 (곡추천하기 검색창, 검색결과화면의 "곡" 섹션) | Spotify Web API | 1시간 (`s-maxage=3600`, Vercel Edge 캐시) | 30초 | 곡추천하기: 검색 버튼/Enter를 누를 때(타이핑 중엔 호출 안 함), 2자 미만이면 클라이언트 검증만 하고 호출 안 함. 검색결과화면: 재검색 제출 시(queryKey에 검색어 포함돼 자동 재조회). 429(Spotify 요청 제한) 응답이면 Retry-After만큼 검색 버튼을 막고 react-query 자동 재시도는 꺼둠(`retry: false`) — 안 그러면 막힌 요청을 곧장 다시 쏴서 제한이 더 길어짐 |

**프론트는 안 쓰지만 아직 살아있는 Vercel 함수** — `api/menu.js`, `api/portal.js`(weather+library 통합), `api/holidays.js` 3개는 전부 새 백엔드로 완전히 대체되어 프론트엔드 어디에서도 더 이상 호출하지 않음. 하지만 Supabase Edge Function `menu-alerts`(1분마다 도는 푸시 발송 로직)가 `/api/menu`, `/api/portal?type=weather`, `/api/holidays`를 직접 `fetch()`하고 있어서 세 함수 다 삭제하면 안 됨. 단, `/api/portal?type=library`는 Edge Function도 호출하지 않아 완전히 죽은 라우트 — `api/portal.js` 리팩토링/삭제 시 이 부분만은 안전하게 정리 가능.

**`/api/sentry-discord-webhook`** — 위 표들과 달리 앱이 호출하는 게 아니라 **Sentry가 호출하는 인바운드 웹훅**. Sentry Internal Integration의 Issue Alert(`event_alert`)를 받아서 `sentry-hook-signature` 헤더로 HMAC-SHA256 서명 검증(비교는 `crypto.timingSafeEqual`) 후, Discord 임베드 메시지 형식으로 변환해 `DISCORD_WEBHOOK_URL`로 재전송함. Sentry 무료(Developer) 플랜엔 네이티브 Discord 연동이 없어서(유료 Slack 연동을 억지로 꽂는 방식뿐) 만든 중계 함수. 캐싱 대상이 아니고 staleTime 개념도 없음. title/culprit뿐 아니라 `event.tags`(`boundary`/`area`/`endpoint`/`queryKey`/`mutationKey` — 존재하는 것만) 도 Discord embed 필드로 같이 보내서, 어느 API·어느 ErrorBoundary에서 터졌는지 Sentry를 열지 않고도 바로 알 수 있음.

### 💾localStorage (디스크)

| 키 | 내용 | 언제 생성되나 |
|---|---|---|
| `period_schedule_cache` | Supabase app_config.period_schedule(다가오는 시간표 변경 배너용 미래 일정 테이블)만 캐싱 | 콜드스타트시 즉시 (TTL 없이 조회 성공 시에만 덮어씀) |
| `lastActiveTab` | 마지막으로 선택한 탭 | 콜드스타트 시 즉시 + 탭 전환마다 갱신 |
| `sb-<project>-auth-token` | Supabase 인증 세션 토큰 (Supabase SDK가 자체관리) | `getOrCreateAnonymousUserId()`가 처음 호출될 때(피드백 전송, 알림 구독 등) — 네이티브는 Keychain/Keystore, 웹은 localStorage |
| `alarm_settings`, `weather_alarm_settings` | 학식·날씨 알림구독 설정값 | 알림 바텀시트를 닫을 때만 |
| `partnerCollegeFilter` | 마지막으로 선택한 제휴단과대 칩 | 제휴탭에서 단과대 칩을 누르면 |
| `shuttle_stop`, `shuttle_lineId` | 마지막으로 선택한 셔틀 정류장·노선 | 사용자가 직접 정류장/노선을 바꿔야 (GPS 자동 선택은 저장 안 함) |
| `public_bus_favorites` | 즐겨찾기한 버스 정류장 | 셔틀탭 '일반 버스' 모드에서 즐겨찾기 토글 시 |
| `hyu_rq_cache` | TanStack Query 캐시 영속화본 | 항상 |
| `ph_phc_<프로젝트키>_posthog` | PostHog device/distinct ID | 앱 코드가 아니라 PostHog JS SDK가 초기화 시 자동 생성 |

### 💾sessionStorage (탭 단위)

| 키 | 내용 | 용도 |
|---|---|---|
| `splashShown` | 이번 세션에서 스플래시를 이미 보여줬는지 | 세션당 스플래시 1회만 노출 |

### 💾메모리 캐시 (JS힙, 새로고침 단위)

| 변수 | 내용 | 용도 |
|---|---|---|
| `cachedNativeToken` | 네이티브 FCM 토큰 | 세션 내 재조회 없이 재사용, 디스크엔 절대 저장 안 함 |

### 💾cookie (도메인 단위)

| 키 | 내용 | 저장되는곳 |
|---|---|---|
| `ph_phc_<프로젝트키>_posthog` | device_id/distinct_id (사용자 식별) | 쿠키·로컬스토리지 이중 저장 |

