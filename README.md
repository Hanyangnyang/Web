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

**Frontend**

![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Capacitor](https://img.shields.io/badge/Capacitor-119EFF?style=for-the-badge&logo=capacitor&logoColor=white)
![Android](https://img.shields.io/badge/Android-3DDC84?style=for-the-badge&logo=android&logoColor=white)
![iOS](https://img.shields.io/badge/iOS-000000?style=for-the-badge&logo=apple&logoColor=white)

TypeScript는 strict 모드로 domain·data·infrastructure·lib 전체 및 presentation 대부분 전환 완료. iOS 빌드·배포는 Codemagic으로 자동화.

**Backend**

![Spring Boot](https://img.shields.io/badge/Spring_Boot-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)
![Java](https://img.shields.io/badge/Java_17-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

[Spring Boot 3.4.1](https://github.com/Hanyangnyang/Backend) 기반 Gradle 멀티모듈(core/user-api/admin-api) 서버가 JWT·QueryDSL로 학식·날씨·도서관 좌석·배너·지하철·셔틀·헬스장 등 핵심 API를 담당(`api.hanyang.life`). Vercel Serverless Functions는 인스타그램 프로필 프록시·공공버스 도착정보·공휴일 조회만 남아 있음.

**Data & Infra**

![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)

Supabase는 익명 Auth·DB·RPC, Firebase는 FCM 푸시 알림(네이티브 + Web)을 담당.

**Testing & Monitoring**

![Playwright](https://img.shields.io/badge/Playwright-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)
![Storybook](https://img.shields.io/badge/Storybook-FF4785?style=for-the-badge&logo=storybook&logoColor=white)
![Sentry](https://img.shields.io/badge/Sentry-362D59?style=for-the-badge&logo=sentry&logoColor=white)
![PostHog](https://img.shields.io/badge/PostHog-000000?style=for-the-badge&logo=posthog&logoColor=white)

**외부 API**: Open-Meteo(날씨·대기질), 서울열린데이터(지하철), 공공데이터포털(공휴일), 경기도 버스정보시스템(공공버스), 한양대도서관 API, Google Gemini(날씨 코멘트 AI), Instagram API


## 📁 폴더 구조 (Clean Architecture)

**Clean Architecture**는 소스 코드 의존성이 항상 바깥(UI·프레임워크·DB)에서 안쪽(비즈니스 로직)을 향하게 강제해 프레임워크·DB·외부 API가 바뀌어도 핵심 로직은 영향받지 않게 하는 것이 핵심이다.

하냥냥에 적용한 방식:

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


### 백엔드 서버 API 엔드포인트 (`https://api.hanyang.life`)

gcTime은 아래 모든 엔드포인트가 오버라이드 없이 전역 기본값(24시간)을 그대로 씀. api 실패시 재시도는 3번, 총 4번 호출함.

| 엔드포인트 | 역할 | 백엔드 Redis TTL, 프론트엔드 TanStackQuery staleTime | refetch 트리거 |
|---|---|---|---|
| `/api/v1/menu` | 학식 메뉴 조회 | 12시간 | 앱부팅시 최초 1회만, 이후엔 네트워크 재연결시 + 사용자가 "다시 시도" 버튼 클릭시 |
| `/api/v1/shuttle` | 셔틀버스 시간표 조회 | 12시간 | 앱부팅시 prefetch만, 이후엔 네트워크 재연결시 + 사용자가 "다시 시도" 버튼 클릭시 |
| `/api/v1/subway/schedule` | 지하철 시간표 조회 | 12시간 | 지하철 연결정보가 필요한 정류장(기숙사·셔틀콕) 선택시 호출 및 refetch + 네트워크 재연결시 + 사용자가 "다시 시도" 버튼 클릭시 |
| `/api/v1/weather` | 날씨·대기질·자외선 스냅샷, 시간별 예보 | 10분 | 앱부팅시 prefetch + 소식탭 클릭시 refetch + 사용자가 "다시 시도" 버튼 클릭시 |
| `/api/v1/weather/briefing` | AI 기반 날씨 브리핑 | 30분(매시 22분 갱신) | 앱부팅시 prefetch + 소식탭 클릭시 refetch (재시도 버튼 없음) |
| `/api/v1/banners` | 홈 배너 조회 | 12시간 | 앱부팅시 prefetch + 이후엔 네트워크 재연결시에만 (재시도 버튼 의도적으로 없음) |
| `/api/v1/library/seats` | 도서관 열람실 좌석 혼잡도 | 3분 | 앱부팅시 prefetch + 소식탭 클릭시 refetch + 사용자가 "다시 시도" 버튼 클릭시 |
| `/api/v1/gym/gym-periods` | 체대 헬스장 운영기간·시간표 조회 | 12시간 | 헬스장 화면 진입시 호출 및 refetch + 사용자가 "다시 시도" 버튼 클릭시 |
| `/api/v1/partnership/partnership-available` | 단과대별 제휴 가맹점·혜택 조회 | 12시간 | (예정) |


### Vercel API 엔드포인트

| 엔드포인트 | 역할 | 외부 호출 대상 | Vercel 캐시 TTL | 프론트엔드 TanStackQuery staleTime | refetch 트리거 |
|---|---|---|---|---|---|
| `/api/insta-proxy` | 인스타 계정 프로필 사진 | Instagram API | 30일 | 24시간 | 마운트 시 자동 |
| `/api/bus` | 공공버스 도착 정보 조회 | 공공데이터포털-경기도 버스정보시스템 | 40초 (메모리 캐시) | 기본 15분 (화면 활성 중엔 30초 간격 강제 폴링, 탭 비활성·유휴 시 중단) | 셔틀 탭 "공공버스" 모드 + 화면 보임(`isPageVisible`) + 사용자 조작 중(`isUserActive`)일 때 30초 간격 자동 폴링(`refetchInterval`) + 새로고침 버튼 수동 refetch |
| `/api/holidays` | 법정공휴일 여부 조회 (셔틀·지하철 dayType 판정용) | 공공데이터포털 | 7일 | 24시간 | 앱부팅 시 prefetch + 마운트시 자동 |


## 💾 캐싱 정책

### 1. 서버 상태 캐싱 — TanStack Query

전역 `QueryClient`(`src/lib/queryClient.ts`) 기본값은 `staleTime` 15분·`gcTime` 24시간·`refetchOnWindowFocus: false`(모바일 웹뷰 특성상 꺼두고, 화면 재진입 시 새로고침 여부는 훅별로 직접 제어)

프로덕션 빌드에서만 `persistQueryClient` + `createSyncStoragePersister`로 쿼리 캐시를 localStorage(`hyu_rq_cache_v1`, `maxAge` 24시간)에 영속화 — 개발 중에는 `public/*.json` 픽스처 수정이 캐시에 가려지지 않도록 꺼둠.


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

