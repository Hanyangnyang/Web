# 하냥냥 → 프론트엔드 포트폴리오 로드맵

> 시리즈 B+ 테크 기업 FE 직무 JD 분석을 바탕으로, 하냥냥에서 FE 역량 스토리를 뽑아내기 위한 작업 단위 로드맵.
> 작성일: 2026-07-07

## 공통 원칙

- **모든 작업은 "측정 → 개선 → 수치" 3단계** — 숫자 없는 최적화는 스토리가 안 됨. 계측(PostHog·Lighthouse·Profiler)을 항상 먼저.
- **작업당 블로그 1편** — 특히 1번(수제 캐시→RQ)과 3번(폰트·CWV)이 가장 강한 글감.
- **전부 깊게 하지 말 것** — 1·3번은 깊게, 나머지는 "근거를 갖고 해봤다" 수준이면 충분.
- **이 문서가 작업 우선순위의 단일 기준** — CLAUDE.md에는 요약 테이블만 유지. 위젯 등 네이티브 작업은 하단 "병렬 트랙" 참고.

## 실행 순서 (2026-07-07 갱신 — 위젯 8월 목표 반영)

```
[7월]  0 (지금 브랜치) → 0.5 (위치정보 UX) → QW (스크롤 분리) → 5-② (캐시 테스트) → 1 (RQ) → 3 (CWV)
[8월]  Android 위젯 (~2주, 병렬 트랙) ∥ 2 (TS 점진 전환 병행)
[9월~] 4 (+5 나머지) → 6 → 7 픽
```

- 위젯 8월 목표 때문에 3(CWV)을 2(TS)보다 앞당김 — 깊은 스토리 2개(1·3)를 7월에 확보
- TS는 파일 단위 점진 작업이라 위젯 기간과 병행 가능

---

## 0. (진행 중) 수제 폴링 캐시 완성 + 계측

`refactor/public-bus-polling-cache` 브랜치와 PostHog 버스 API 계측이 로드맵 전체의 출발점.
여기서 남기는 **"개선 전" 수치**(API 호출 수, 중복 fetch 빈도)가 1번 작업의 before 데이터가 된다.

- [ ] 수제 폴링 캐시 완성
- [ ] PostHog 계측 충분히 심기 (API 호출 수, 캐시 히트율 등)

---

## 0.5 위치정보 UX — 권한 인지 프리페치 + last-known 캐시

### 문제 스토리

셔틀/공공버스가 위치를 **탭 진입 시점에, 서로 따로** 측위한다.
[useShuttle.js](../src/presentation/hooks/useShuttle.js) L58은 Capacitor Geolocation을, ShuttleView의 공공버스(L599)는
`navigator.geolocation`을 각각 호출하고, 둘 다 `maximumAge` 미설정(기본 0)이라 OS 캐시 위치도 안 쓰고
매번 fresh 측위(최대 5초)를 기다린다. 그 결과:

1. **칩 점프**: 셔틀 탭이 localStorage 값으로 먼저 렌더 → GPS 도착 → 출발지 칩이 눈앞에서 바뀌고,
   칩에 붙은 "이 출발지가 맞나요?" 툴팁도 뒤늦게 이동한다.
2. **이중 로딩**: 공공버스 진입 시 `viewModeChanged`로 기본 순서 top2를 fetch(로딩 1차) →
   좌표 도착 시 `coordsJustLoaded`로 재정렬된 top2를 다시 fetch(로딩 2차)
   ([ShuttleView.jsx](../src/presentation/components/ShuttleView.jsx) L815-851).

### 해결

- 두 측위 코드를 단일 `useLocation` 모듈로 통합 (Capacitor로 단일화)
- 앱 시작 시 `Geolocation.checkPermissions()` → **권한이 이미 granted일 때만** 백그라운드 프리페치
  (첫 사용자에게 맥락 없는 권한 팝업을 띄우지 않는 것이 핵심 — 권한 승인율 보호)
- 마지막 좌표를 localStorage에 저장 → 다음 세션 last-known으로 낙관적 초기 렌더,
  fresh 좌표 도착 시 가장 가까운 정류소가 실제로 바뀐 경우에만 UI 업데이트
- `maximumAge`(3~5분)로 OS 캐시 위치 즉시 활용
- 1번 RQ 마이그레이션 시 `['geolocation']` 쿼리로 승격 (`staleTime` ↔ `maximumAge` 대응)

### 증빙 지표

- 탭 진입 → UI 안정화(칩·목록 확정) 시간
- 정류소당 도착정보 fetch 횟수 2회 → 1회 (PostHog 계측 이미 있음)

### 한 줄 서사

> "권한 프롬프트 타이밍을 해치지 않는 조건부 프리페치와 last-known 캐시로, GPS 대기가 만들던 이중 로딩과 UI 점프를 제거했습니다."

### 체크리스트

- [ ] useLocation 통합 모듈 (Capacitor 단일화)
- [ ] checkPermissions 기반 앱 시작 조건부 프리페치
- [ ] last-known 좌표 캐시 + 낙관적 렌더
- [ ] maximumAge 적용
- [ ] 공공버스 이중 로딩 해소 + before/after 계측

---

## QW. 탭별 스크롤 컨테이너 분리 (반나절 quick win)

### 문제 스토리

[App.jsx](../src/App.jsx) L183 — 5개 탭이 **하나의 스크롤 컨테이너**를 공유하고 `display: none`으로만 전환된다.
탭 A에서 스크롤을 내리고 탭 B로 가면 B가 A의 스크롤 위치를 물려받는다.
CafeteriaView(L102)·PartnershipView(L206)의 수동 `scrollTop = 0` 리셋은 이를 덮으려는 증상 패치다.

### 해결

부모는 `overflow-hidden`, 각 탭 래퍼가 자신의 `overflow-y-auto` 컨테이너를 갖도록 분리 +
탭별 scrollTop 저장/복원(ref 맵). 수동 리셋 핵 제거.
부수 효과: "탭 복귀 시 보던 위치 복원" UX 개선.
주의: [ShuttleView.jsx](../src/presentation/components/ShuttleView.jsx) L235의 `window.scrollY` 참조,
PortalView의 자체 scrollContainerRef 등 공유 컨테이너를 가정한 코드 점검 필요.

### 한 줄 서사

> "display:none 탭 전환이 공유하던 스크롤 상태를 탭별 컨테이너로 분리해, 탭 복귀 시 스크롤이 복원되는 UX로 바꿨습니다."

### 체크리스트

- [ ] 탭별 스크롤 컨테이너 분리 (패딩도 탭별로 이동)
- [ ] scrollTop 저장/복원
- [ ] 기존 scrollTop=0 핵 제거 + 공유 가정 코드 점검

---

## 1. 서버 상태 관리 — 수제 캐시를 TanStack Query로 ⭐ 최우선

### 문제 스토리

하냥냥은 날씨·도서관·셔틀·배너 등 모든 서버 데이터를 훅마다 손으로 캐싱하고 있다.
[usePortalData.js](../src/presentation/hooks/usePortalData.js)는 모듈 레벨 캐시, 리스너 구독, 지수 백오프 재시도,
stale 판정, 탭 재진입 갱신을 전부 직접 구현해서 226줄이 됐고, 같은 패턴이 useShuttle·useBanners에
조금씩 다르게 복제돼 있다. 그 결과 "정류소 아코디언 토글 시 버스 API 중복 fetch" 같은 버그가
실제로 발생했고(커밋 히스토리에 있음), 서버 상태와 클라이언트 UI 상태가 구분 없이 `useState`에 섞여 있다.

### 해결

`@tanstack/react-query` 도입.

- queryKey 기반 요청 dedup, `staleTime`/`gcTime`, `refetchOnWindowFocus`, `retry`가 수제 구현을 전부 대체
- localStorage 복원은 `persistQueryClient`
- 이 과정에서 서버 상태(RQ) / 클라이언트 상태(useState) 분리가 자동으로 정리됨

### 증빙 지표

- PostHog API 호출 수 before/after
- 삭제된 코드 줄 수 (226줄 → 수십 줄)
- 중복 fetch 계열 버그 소멸

### 한 줄 서사

> "캐시 무효화·중복 제거·재시도를 직접 구현하며 겪은 문제로, React Query가 내부에서 무엇을 해주는지 설명할 수 있습니다."

### 체크리스트

- [ ] (선행) 5-② 캐시 동작 테스트 작성
- [ ] usePortalData → useQuery 마이그레이션
- [ ] useShuttle, useBanners 등 나머지 훅 마이그레이션
- [ ] persistQueryClient로 localStorage 복원 대체
- [ ] before/after 수치 정리 + 블로그

---

## 2. TypeScript 점진 전환

### 문제 스토리

55개 소스 파일이 전부 JS다. 하냥냥의 데이터 원천은 학교 홈페이지 **스크래핑**이라 응답 형태가
언제든 깨질 수 있는데, 그 데이터가 아무 타입 검증 없이 BFF → 훅 → 컴포넌트로 흐른다.
Clean Architecture로 Repository 인터페이스를 나눠놨지만 JS라서 인터페이스에 강제력이 없고,
깨진 데이터는 Sentry 런타임 에러로만 발견된다.

### 해결

- `tsconfig` `allowJs`로 파일 단위 점진 전환
- 순서: `domain/`(Entity·인터페이스) → `data/` → hooks → components
- API 경계에 `zod` 런타임 스키마 검증 (타입은 컴파일 타임, zod는 런타임 — 스크래핑 데이터엔 둘 다 필요)

### 증빙 지표

- Sentry의 타입 기인 런타임 에러 감소
- 전환률 (파일 수)

### 한 줄 서사

> "스크래핑 기반 데이터라 '컴파일 타임 타입 + 런타임 검증' 이중 방어를 설계했습니다."

### 체크리스트

- [ ] tsconfig 세팅 (allowJs, strict)
- [ ] domain/ 전환
- [ ] data/ 전환 + API 경계 zod 검증
- [ ] hooks 전환
- [ ] components 전환

---

## 3. 성능 최적화 — 번들·폰트·Core Web Vitals

### 문제 스토리

지금은 측정 장치 없이 감으로 최적화하는 상태인데, 코드에서 이미 확인된 구체적 문제가 셋 있다.

1. [index.html](../index.html) L5 — 한글 폰트를 **OTF 원본 그대로** preload. 한글 OTF는 글립 1만+개라 보통 수 MB이고, LCP를 직접 민다.
2. [index.html](../index.html) L26 — 카카오 SDK가 `<head>`에서 동기 로드. 카카오 CDN이 느리면 첫 페인트 전체가 블로킹된다.
3. firebase 웹 SDK 같은 무거운 의존성이 초기 청크에 들어있는지 아무도 모른다.

그리고 탭 전환 시 1,700줄짜리 컴포넌트가 통째로 마운트되는 구조라 INP도 나쁠 가능성이 높다.

게다가 앱이 hanyang.life를 **원격 로드**하는 구조라(6번 참고), 이 웹 성능 개선은 곧 앱 콜드 스타트 개선이기도 하다 — 한 번의 작업이 웹과 앱 양쪽 지표로 이중 계산되는 가장 가성비 좋은 구간.

### 해결

- **측정 먼저**: `rollup-plugin-visualizer`(번들), Lighthouse CI, `web-vitals` → PostHog 전송(LCP·CLS·INP), Chrome DevTools Performance 탭(long task)
- 폰트: 서브셋팅 + woff2 변환 + `font-display` + `size-adjust`(스왑 CLS 방지)
- 카카오 SDK: 공유 버튼 클릭 시점 dynamic load
- 코드 스플리팅: 탭별 `React.lazy` + 지연 마운트, 탭 전환에 `useTransition`(INP 개선)

### 증빙 지표

- 폰트 KB (통상 80~95% 감량)
- 초기 번들 KB
- LCP / CLS / INP before/after
- 웹뷰 콜드 스타트 TTI

### 한 줄 서사

> "Lighthouse와 필드 데이터(PostHog)로 병목을 특정하고, 한글 폰트 서브셋팅과 코드 스플리팅으로 LCP를 X→Y초로 줄였습니다."

### 체크리스트

- [ ] rollup-plugin-visualizer 번들 분석
- [ ] web-vitals → PostHog 계측
- [ ] 폰트 서브셋 + woff2 + font-display + size-adjust
- [ ] 카카오 SDK 지연 로드
- [ ] 탭별 React.lazy 코드 스플리팅 + useTransition
- [ ] before/after 수치 정리 + 블로그

---

## 4. 컴포넌트 설계 + 리렌더 최적화 — ShuttleView 해체

### 문제 스토리

[ShuttleView.jsx](../src/presentation/components/ShuttleView.jsx)가 1,762줄, 알람 설정 화면 두 개가 각 900줄대다.
여기에 `setInterval`이 앱 전체 8곳 — 30초 폴링과 초 단위 타이머가 거대 컴포넌트를 통째로 리렌더시킨다.
"아코디언 토글 중복 fetch" 버그도 결국 상태와 뷰가 한 파일에 엉켜서 생긴 문제였다.
알람 시간 휠 피커에는 `onScroll` 핸들러가 8개에 `touchmove passive: false`까지 있어서
컴포지터 스레드 스크롤을 블로킹하고, 제휴 검색은 로컬 필터링인데 타이핑마다 목록 전체가 리렌더된다.

### 해결

- React DevTools Profiler로 리렌더 측정 → 컴포넌트 분해
- 흩어진 타이머를 `useSyncExternalStore` 기반 단일 시계 스토어로 통합, 구독을 말단으로
- 검색에 `useDeferredValue` (로컬 필터링엔 debounce보다 적합 — "debounce는 이벤트를 줄이고 useDeferredValue는 렌더링을 늦춘다" 비교 자체가 글감)
- 스크롤 핸들러 rAF throttle + passive 리스너 정리
- 분해하며 나온 공통 UI(카드·아코디언·바텀시트·탭)를 `ui/`로 추출 → **Storybook** 도입
- 여력 되면 아코디언 하나만 headless 패턴 + WAI-ARIA (키보드·포커스 트랩)

### 증빙 지표

- Profiler 커밋 횟수·렌더 시간
- INP
- 공통 컴포넌트 재사용처 수

### 한 줄 서사

> "초당 리렌더되는 1,700줄 컴포넌트를 프로파일링으로 분해하고, 공통 컴포넌트를 접근성 표준(WAI-ARIA)에 맞춰 시스템화했습니다."

### 체크리스트

- [ ] Profiler + Performance 탭으로 리렌더/long task 측정
- [ ] 타이머 useSyncExternalStore 통합
- [ ] ShuttleView 분해
- [ ] 제휴 검색 useDeferredValue
- [ ] 스크롤 핸들러 rAF throttle + passive 정리
- [ ] 공통 UI 추출 + Storybook
- [ ] (선택) headless 아코디언 + WAI-ARIA

---

## 5. 테스트 — 리팩토링의 안전망

### 문제 스토리

테스트가 0개다. 가장 위험한 건 [api/menu.js](../api/menu.js)의 cheerio 스크래핑 파서 —
학교가 홈페이지 마크업을 바꾸면 **조용히** 깨지고, 사용자 제보로만 알게 되는 구조다.
그리고 1번(RQ 마이그레이션) 같은 큰 리팩토링을 안전망 없이 하면 "바꿨는데 뭐가 깨졌는지 모르는" 상태가 된다.

### 해결

`Vitest`(Vite 네이티브 — Jest 대신 선택한 이유를 말할 수 있는 것 자체가 플러스) + Testing Library.

1. 학교 홈페이지 HTML을 fixture로 저장해 파서 회귀 테스트
2. **1번 마이그레이션 전에 캐시 동작 테스트를 먼저 작성 → 마이그레이션 후 그린 유지** (교과서적 리팩토링 서사)
3. 셔틀 시간 계산 같은 순수 로직 테스트
4. E2E는 `Playwright`로 핵심 플로우 1~2개만 (탭 전환, 학식 조회)

### 한 줄 서사

> "외부 마크업에 의존하는 스크래퍼를 fixture 기반 회귀 테스트로 방어하고, 테스트를 안전망 삼아 데이터 레이어를 전면 교체했습니다."

### 체크리스트

- [ ] Vitest + RTL 세팅
- [ ] ② 캐시 동작 테스트 (1번 선행)
- [ ] menu 파서 fixture 회귀 테스트
- [ ] 셔틀 시간 계산 로직 테스트
- [ ] Playwright 핵심 플로우 1~2개

---

## 6. Next.js 웹 버전 + 모노레포 (2번 완료 후)

### 문제 스토리

hanyang.life로 웹 서비스 중이지만 CSR SPA라서 검색엔진에는 빈 `<div>`와 제네릭 메타태그 하나만 보인다.
학생들이 매일 검색하는 "한양대 에리카 학식", "에리카 셔틀 시간표" 트래픽을 전부 놓치고 있고,
카톡 공유 미리보기도 어떤 페이지든 앱 아이콘 하나다.

중요한 전제: [capacitor.config.json](../capacitor.config.json)의 `server.url`이 hanyang.life를 가리키므로,
앱은 로컬 번들이 아니라 **같은 웹을 원격 로드**한다. 즉 웹 = 앱 단일 배포이고, 웹 배포가 곧 앱 OTA 업데이트다.
따라서 "앱엔 서버가 없어 SSR 불가"가 아니라 전체를 Next.js로 옮기는 선택지도 기술적으로 열려 있다.
그럼에도 앱 경험의 우선순위는 SW 프리캐시된 셸의 즉시 구동(재실행·오프라인)이지 SEO가 아니므로,
전면 마이그레이션 대신 **검색 수요 경로만 SSR/ISR로 분리**하는 것이 합리적이다.
"할 수 있는데 안 한 이유"까지 포함한 이 트레이드오프 검토 자체가 스토리.

### 해결

검색 수요 콘텐츠만 골라 **작게**(랜딩 + 학식 + 셔틀, 2~3페이지) Next.js 웹 구축.
기존 SPA(=앱 셸)는 그대로 두고, 같은 도메인에서 검색용 경로만 Next.js로 서빙(Vercel 멀티 프로젝트 라우팅 또는 서브도메인).

- **ISR**: 학식은 하루 단위 갱신 — `revalidate`의 교과서적 사용처. 이미 [api/menu.js](../api/menu.js) L102에서 `s-maxage` + `stale-while-revalidate`로 수동 구현하던 것의 프레임워크화 (1번과 같은 서사 구조)
- **RSC**: 저상호작용 콘텐츠라 클라이언트 JS 최소화
- `ImageResponse`로 "오늘의 학식" 동적 OG 이미지
- 이 시점에 pnpm workspace 모노레포: `apps/web` + `apps/mobile` + `packages/shared`(타입·UI 공유) — 억지가 아닌 필연이 됨

### 증빙 지표

- Search Console 노출·클릭
- RSC vs SPA 페이지 번들 비교
- 웹 → 앱 설치 전환

### 한 줄 서사

> "하나의 서비스 안에서 앱 셸은 CSR + SW 캐시, 검색 유입 경로는 Next.js ISR — 렌더링 전략을 경로 단위로 분리해 선택했습니다."

### 체크리스트

- [ ] pnpm workspace 모노레포 재편 (apps/web·mobile + packages/shared)
- [ ] 랜딩 + 학식 + 셔틀 페이지 (ISR + RSC)
- [ ] 동적 OG 이미지
- [ ] Search Console 등록 + 지표 추적

---

## 7. 2차 소재 (여력 될 때, 추천 순)

1. **웹뷰 하이브리드 FE 전문성** — 토스·카카오류 FE의 실제 환경이 웹뷰. 콜드 스타트 TTI, 네이티브 브리지(FCM 흐름 이미 있음), safe-area·키보드 처리를 스토리로. 특히 하냥냥은 `server.url` 원격 로드 구조 — "스토어 심사 없는 즉시 배포"를 얻는 대신 "첫 실행이 네트워크에 의존"하는 트레이드오프를 SW 프리캐시로 완충하는 아키텍처 자체가 차별화된 글감.
2. **성능 예산 자동화** — `size-limit` + Lighthouse CI를 GitHub Actions에. "번들 X KB 초과 시 PR 실패" — 일회성 개선을 회귀 방지 문화로.
3. **오프라인 복원력** — workbox `runtimeCaching` + 오프라인 폴백 UX ("지하 구간에서 셔틀 시간표").
4. **피처 플래그 실험** — PostHog flags(이미 연동됨)로 배포 → 지표 비교 → 롤아웃. Product mindset 실증.
5. **React 19 신기능** — 알람 저장 `useOptimistic`, View Transitions API 적용기.
6. **BFF HTTP 캐싱 언어화** — 이미 구현돼 있는 자산. CDN 캐시 vs 브라우저 캐시 vs SWR 구분을 설명 가능하게 정리 + [api/subway.js](../api/subway.js) L190 `no-store` 같은 엔드포인트별 정책 근거 점검.

## 병렬 트랙: Android 위젯 (개인 목표, 8월 타임박스 ~2주)

웹 FE JD에 직접 기여하지 않으므로 FE 우선순위에 넣지 않고 **별도 트랙**으로 진행.

스코프: AppWidgetProvider + RemoteViews 기본 위젯 → WorkManager 주기 갱신 + WidgetRepository(API 직접 호출)
→ SharedPreferences 앱↔위젯 데이터 연동 → 딥링크 연결. 핵심 트러블슈팅: Doze Mode 갱신 지연, 앱↔위젯 데이터 불일치.
이후 iOS 위젯은 Mac 세팅 완료 후 (Android → Mac → iOS 순서 필수, CLAUDE.md 개발 원칙 참고).

FE 로드맵과의 연결점:

- 위젯은 같은 BFF(`/api/menu`)를 소비하는 **3번째 클라이언트** — 2번(TS/zod)의
  "하나의 API 계약을 웹·앱·위젯이 공유" 스토리로 연결 가능
- "웹뷰 하이브리드 + 네이티브 위젯" 프로필은 7-1(웹뷰 전문성) 각도와 시너지
- TS 전환(2번)은 파일 단위 점진 작업이라 위젯 기간과 병행

---

### 억지로 하지 않기로 한 것

- **앱 본체 SSR/SSG**: 웹뷰엔 서버가 없어 무의미 — "왜 안 썼는지"를 설명하는 게 판단력 (6번의 웹 버전이 이 공백을 메움)
- **이미지 lazy loading**: `<img>`가 전체 3곳뿐이라 큰 스토리 안 됨. 인스타 리스트에 `loading="lazy"` 한 줄이면 충분 — 하냥냥의 진짜 에셋 최적화 스토리는 폰트(3번)
