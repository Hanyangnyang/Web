<p align="center">
  <img src="./assets/icon.png" alt="하냥냥 로고" width="120" />
</p>

<h1 align="center">😸 하냥냥</h1>

<p align="center">
  한양대학교 ERICA인들을 위한 캠퍼스 라이프스타일 유틸리티 앱<br/>
  학식 · 셔틀버스 · 제휴 · 도서관 혼잡도 · 헬스장 시간표 등<br/>
  매일 확인해야 하는 캠퍼스 정보를 한곳에 모아 더 슬기로운 에리카 캠퍼스 라이프를 즐겨보세요
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
- 🏫 단과대별 제휴 정보 모음
- 🔔 학식·날씨 맞춤 푸시알림 (FCM)
- 🎓 그 외 편리한 학교 생활을 위한 기타 기능

> 💡 원래는 도서관 열람실 입장용 QR 코드 발급 + 좌석 예약/반납 기능도 준비했었는데, 학교 도서관 측에 문의해보니 외부 앱에서 제공하면 안 된다고 해서 접었어요..ㅎㅎ

## 🛠 기술 스택

| 구분 | 사용 기술 |
|---|---|
| 프론트엔드 | React 19 + Vite (Capacitor WebView로 래핑) |
| 언어 | TypeScript (strict) — domain·data·infrastructure·lib 전체 및 presentation 대부분 전환 완료 |
| 스타일링 | Tailwind CSS |
| Android | Capacitor + Java |
| iOS | Capacitor (Codemagic으로 빌드) |
| BFF (Vercel) | Vercel Serverless Functions — 인스타그램 프로필 프록시·공공버스 도착정보·공휴일 조회 |
| 백엔드 서버 | [Spring Boot](https://github.com/Hanyangnyang/Backend) 3.4.1 (Java 17, Gradle 멀티모듈: core/user-api/admin-api) — PostgreSQL·Redis·JWT·QueryDSL, `api.hanyang.life`에서 학식·날씨·도서관 좌석·배너·지하철·셔틀 등 핵심 API 제공 |
| DB / Auth | Supabase |
| 푸시 알림 | Firebase Cloud Messaging (FCM) — 네이티브(Android/iOS) + Web 동시 지원 |
| 에러 모니터링 | Sentry  |
| 사용자 분석 | PostHog |
| 테스트 | Playwright(E2E), Vitest, Storybook(UI용) |
| 외부 API | Open-Meteo(날씨·대기질), 서울열린데이터(지하철), 공공데이터포털(공휴일), 경기도 버스정보시스템(공공버스), 한양대도서관 API, Google Gemini(날씨 코멘트 AI), Instagram API |


## 📁 폴더 구조

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

## 🏗 프로젝트 아키텍처

학식·날씨·도서관 혼잡도·배너·지하철·셔틀 등 핵심 데이터는 자체 백엔드 서버(`api.hanyang.life`, Spring Boot)를 거치고, 인스타그램 프로필·공공버스·공휴일 조회는 Vercel BFF(Serverless Functions)를 경유합니다. 앱이 외부 API를 직접 호출하는 경우는 없습니다.
Supabase는 익명 Auth·피드백 저장·앱설정 조회·알림구독 RPC 목적으로 클라이언트에서 직접 연결합니다.
푸시 알림은 Firebase Cloud Messaging(FCM)으로 발송되며, iOS 빌드·배포는 Codemagic으로 자동화되어 있습니다.


### Supabase 테이블

| 테이블 | 용도 |
|--------|------|
| `feedbacks` | 사용자 피드백 저장 (익명 user_id) |
| `app_config` | 앱 레벨 설정 조회 (학기 정보, 휴일/주말 오버라이드, 운영일 플래그 등) |

`devices`(FCM 토큰)·`subscriptions`(알림 구독 설정) 테이블은 클라이언트에서 직접 조회하지 않고 RPC로만 접근합니다 — `get_alarm_subscription`(구독 조회), `upsert_alarm_subscription`(구독 생성·수정·해제)


### 백엔드 서버 API 엔드포인트

베이스 URL: `https://api.hanyang.life` (env: `VITE_API_BASE_URL`)

| 엔드포인트 | 역할 | staleTime |
|---|---|---|
| `/api/v1/menu` | 학식 메뉴 조회 (기간별) | 1시간 |
| `/api/v1/shuttle` | 셔틀버스 시간표 조회 | 12시간 |
| `/api/v1/subway/schedule` | 지하철 시간표 조회 | 12시간 |
| `/api/v1/weather` | 날씨·대기질·자외선 스냅샷 + 시간별 예보 | 10분 |
| `/api/v1/weather/briefing` | AI 기반 날씨 브리핑 | 30분 (매시 22분 갱신) |
| `/api/v1/banners` | 홈 배너 조회 | 24시간 |
| `/api/v1/library/seats` | 도서관 열람실 좌석 혼잡도 | 3분 |


### Vercel API 엔드포인트

| 엔드포인트 | 역할 | 외부 호출 대상 | 캐시 TTL |
|---|---|---|---|
| `/api/insta-proxy` | 인스타 계정 프로필 사진 | Instagram API | 30일 |
| `/api/bus` | 공공버스 도착 정보 조회 | 공공데이터포털 (경기도 버스정보시스템) | 40초 (메모리 캐시) |
| `/api/holidays` | 법정공휴일 여부 조회 (셔틀·지하철 dayType 판정용) | 공공데이터포털 | 7일 |


## 💾 캐싱 정책

### 1. 서버 상태 캐싱 — TanStack Query

전역 `QueryClient`(`src/lib/queryClient.ts`) 기본값은 `staleTime` 15분·`gcTime` 24시간·`refetchOnWindowFocus: false`(모바일 웹뷰 특성상 꺼두고, 화면 재진입 시 새로고침 여부는 훅별로 직접 제어)

프로덕션 빌드에서만 `persistQueryClient` + `createSyncStoragePersister`로 쿼리 캐시를 localStorage(`hyu_rq_cache_v1`, `maxAge` 24시간)에 영속화 — 개발 중에는 `public/*.json` 픽스처 수정이 캐시에 가려지지 않도록 꺼둠.

도메인별 staleTime은 위 "백엔드 서버 API 엔드포인트" 표를 따르고, 그 외 항목은 다음과 같음:

| 대상 | staleTime | 비고 |
|---|---|---|
| 헬스장 시간표 | 24시간 | 정적 파일(`gymSchedule.json`) |
| 공휴일 여부 | 24시간 | Vercel `/api/holidays` |
| 인스타그램 프로필 | 24시간 | Vercel `/api/insta-proxy` |
| 공공버스 도착정보 | 기본 15분 | 화면 활성 중엔 30초 간격으로 강제 폴링, 탭 비활성·유휴 시 중단 |


### 2. 로컬 상태 캐싱 — localStorage

React Query가 다루지 않는 값들은 화면별로 개별 저장:

| 키 | 내용 | 용도 |
|---|---|---|
| `app_config_cache` | 학기·휴일 등 앱 설정 스냅샷 | 부팅 시 즉시 렌더링용 — TTL 없이 최신 조회 성공 시에만 덮어씀 |
| `sb-<project>-auth-token` | Supabase 인증 세션 | 재실행 후 로그인 유지 (네이티브는 Keychain/Keystore, 웹은 localStorage) |
| `lastActiveTab` | 마지막 선택 탭(학식/포탈) | 재실행 시 복원 |
| `alarm_settings`, `weather_alarm_settings` | 알림 구독 설정 로컬 미러 | Supabase RPC 동기화 전 상태 보관 |
| `partnerCollegeFilter` | 마지막 제휴 필터 | UX 상태 복원 |
| `shuttle_stop`, `shuttle_lineId` | 마지막 셔틀 정류장·노선 | UX 상태 복원 |
| `public_bus_selected_stops`, `public_bus_favorites` | 선택·즐겨찾기 버스 정류장 | UX 상태 복원 |

FCM 토큰은 메모리 변수로만 유지되며 디스크에는 저장되지 않음.

