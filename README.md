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

학식·날씨·도서관 혼잡도·배너·지하철·셔틀·학사달력/공휴일·통합피드백 등 핵심 데이터는 자체 **백엔드 서버**(Spring Boot)를 거치고, 인스타그램 프로필·공공버스 조회는 **Vercel BFF**(Serverless Functions)를 경유합니다. 앱이 외부 API를 직접 호출하는 경우는 거의 없습니다.
**Supabase**는 익명 Auth·앱설정(다가오는 시간표 변경 배너용 `period_schedule`만)·알림구독 RPC 목적으로 클라이언트에서 직접 연결합니다.
푸시 알림은 **Firebase Cloud** Messaging(FCM)으로 발송되며, iOS 빌드·배포는 Codemagic으로 자동화되어 있습니다.

### 🔌Supabase 테이블

| 테이블 | 용도 |
|--------|------|
| `app_config` | 다가오는 시간표 변경 배너용 `period_schedule`만 조회 — 현재기간·공휴일·강제주말·미운행 오버라이드 등 나머지 필드는 `/api/v1/academic/status`로 이전 완료, 더 이상 조회 안 함 |

`devices`(FCM 토큰), `subscriptions`(알림 구독 설정) 테이블은 클라이언트에서 직접 조회하지 않고 RPC로만 접근합니다 — `get_alarm_subscription`(구독 조회), `upsert_alarm_subscription`(구독 생성·수정·해제)


### 🔌API 엔드포인트와 💾캐싱 정책

- 서버 데이터는 **TanStack Query**로 캐싱하고, `localStorage`에 24시간 영속화해 앱을 다시 켜도 마지막 데이터를 바로 보여줍니다.
- 앱 `staleTime`은 백엔드 캐시 TTL·갱신 주기에 맞춰 데이터별로 다르게 잡습니다 (예: 도서관 좌석 3분, 학식·날씨 10분, 셔틀 1시간, 정적 데이터 24시간).
- 실시간성이 필요한 공공버스 도착정보만 30초 폴링하며, 화면이 안 보이거나 3분간 조작이 없으면 폴링을 멈춥니다.

엔드포인트별 캐시 정책과 브라우저 저장소 키 목록은 [docs/dev/caching.md](docs/dev/caching.md)에 있습니다.

---

## 🔗딥링크와 라우팅

카카오 공유 링크, 푸시 알림 클릭, 배너 클릭 — 앱으로 들어오는 경로가 여러 개지만, 네이티브(Android/iOS)에서는 전부 `hanyang-deeplink` 커스텀 이벤트 → `App.tsx`의 `routeFromParams()`라는 단일 진입점으로 모인다. 배너 클릭만 유일하게 이 파이프라인을 안 타는데, 클릭 시점에 이미 앱이 떠 있어서 딥링크 파싱 자체가 필요 없기 때문(`BannerCarousel.tsx`가 직접 처리).

| 진입 경로 | URL 형식 | 처리 위치 | 도착 화면 |
|---|---|---|---|
| 카카오톡 공유 (학식) | `?date=YYYY-MM-DD&cafe=<cafeId>&type=<조식\|중식\|석식\|천원...>` | `App.tsx` 최초 마운트 시 `date`/`cafe`/`type` 파라미터 체크(`activeTab`/`isCafeteriaLink`/`showCafeDeepLinkLoader` 초기값) → 네이티브는 `MainActivity`(커스텀 스킴 `kakao{key}://kakaolink?...`)/`AppDelegate`가 가로채 `routeFromParams()`까지 전달 | 학식탭 + 학식 딥링크 전용 로더 스플래시 |
| 푸시 알림 - 학식 | `?tab=cafe&date=...&cafe=...` (끼니별 알림은 `&type=...`도 추가) | 네이티브: `PushNotifications`의 `pushNotificationActionPerformed` 리스너 → `routeFromParams()`. 콜드스타트로 인해 리스너 등록 전에 이벤트가 드랍될 수 있어, Android는 `MainActivity.onCreate()`에서 Intent extra(`link`)를 직접 읽어 같은 경로로 주입 | 학식탭 + 학식 딥링크 전용 로더 스플래시 |
| 푸시 알림 - 날씨 | `?tab=weather` | 위와 동일한 `routeFromParams()` 파이프라인 | 소식탭(portal) |
| 배너 클릭 (내부 링크) | `?tab=<cafe\|shuttle\|portal\|partner\|misc>&chip=<...>&box=<...>` | `BannerCarousel.tsx`의 `handleClick()` — `url.origin === window.location.origin`이 완전히 일치할 때만 `onNavigateToTab()`을 직접 호출. 딥링크 이벤트나 `routeFromParams`는 안 거침 | tab 전환 + (`chip`이면 캠퍼스맵 특정 칩, `box`면 기타탭 특정 서브뷰까지 지정) |
| 배너 클릭 (외부 링크) | 그 외 모든 URL | `window.open(url, '_blank')` | 외부 브라우저 |

푸시 알림 링크는 Supabase Edge Function `menu-alerts`가 발송 시점에 만든다(`buildFCMMessage`가 `data.link` 필드에 담아 FCM 페이로드로 전송).

**`chip`/`box` 파라미터는 배너 전용** — 카카오 공유·푸시 알림 딥링크(`routeFromParams`)는 `tab`/`date`/`cafe`/`type`만 처리하고 `chip`/`box`는 안 읽는다. "캠퍼스맵 특정 칩으로 바로 진입하는 카카오 공유 링크" 같은 건 지금 구조에서 못 만든다 — 필요해지면 `routeFromParams`에 `chip`/`box` 케이스를 추가해야 함.

**딥링크 진입 시 앱 내부 상태 전달 방식**:
- Android 콜드스타트 시 `MainActivity`가 React 마운트 전에 도착한 파라미터를 `window.__pendingDeepLinkParams`에 동기 저장 → `App.tsx`가 마운트되며 즉시 소비.
- 앱이 이미 실행 중일 때(`onNewIntent`)는 `hanyang-deeplink` CustomEvent로 전달.
- `App.addListener('appUrlOpen', ...)` 같은 Capacitor 표준 URL-open 리스너는 안 씀 — Universal Links(iOS)/App Links(Android) 둘 다 각 네이티브 레이어(`AppDelegate.swift`/`MainActivity.java`)에서 직접 가로채 위 커스텀 브릿지로 흘려보내는 자체 구현.

