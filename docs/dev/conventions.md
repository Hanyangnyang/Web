# 코드 컨벤션

새 코드는 기존 코드와 같은 모양으로 씁니다. 아래 규칙의 기준은 **학식(`useMenu`), 셔틀(`useShuttle`·`usePublicBus`), 소식탭(`useWeather`·`useLibraryStatus`·`useBanners`)** 입니다. 헷갈리면 이 파일들을 열어서 그대로 따라 하세요.

## 한눈에 보기 — API 하나가 화면까지 오는 길

```
Component ──> Hook ──> UseCase ──> Repository ──> DataSource ──> HttpClient ──> 백엔드
(화면)       (상태·캐시)  (진입점)    (검증·변환)     (호출만)       (fetch·타임아웃)
                                        │
                                        └─ Schema(zod)로 응답 검증 → Entity로 변환
```

| 레이어 | 위치 | 하는 일 | 하면 안 되는 일 | Spring으로 치면 |
|---|---|---|---|---|
| Component | `src/presentation/components/<기능>/` | 훅이 준 값을 그리기 | `di.ts` import, `fetch` 호출, 응답 가공 | View |
| Hook | `src/presentation/hooks/use<기능>.ts` | `useQuery`로 캐시·로딩·에러 관리, 화면용 상태 | 응답 검증, URL 하드코딩 | Controller 비슷 |
| UseCase | `src/domain/usecases/Get<기능>UseCase.ts` | 훅이 부르는 진입점. 대부분 `repository` 한 줄 위임 | React·HTTP 의존 | Service |
| Repository 인터페이스 | `src/domain/repositories/I<기능>Repository.ts` | 반환 타입 계약(Entity) | 구현 | `interface XxxRepository` |
| Repository 구현 | `src/data/repositories/<기능>Repository.ts` | `success` 확인, zod 검증, DTO → Entity 변환, 에러 태깅 | 캐싱(TanStack Query 몫), UI 문구 | RepositoryImpl + Mapper |
| Schema | `src/data/schemas/<기능>Schema.ts` | 응답 DTO의 zod 스키마 = 런타임 검증 + 타입 | 화면용 변환 | DTO + Bean Validation |
| DataSource | `src/data/datasources/<기능>ApiDataSource.ts` | 엔드포인트 호출 한 줄 + `parseOrThrow` | 검증·변환 | Feign/RestClient 인터페이스 |
| Entity | `src/domain/entities/<이름>.ts` | 화면이 쓰는 도메인 타입, `create<이름>()` 팩토리, 순수 계산 함수 | React·HTTP 의존 | Domain 객체 |
| DI | `src/di.ts` | 위 객체들을 조립해서 UseCase를 export | 로직 | `@Configuration` |

규칙의 방향: `presentation` → `domain` ← `data`. `domain`은 `data`·`presentation`·`infrastructure`를 import하지 않습니다(같은 domain, `utils/`, React·HTTP와 무관한 순수 함수인 `lib/searchText.ts` 정도만).

## 새 API 연결 순서

예: 백엔드에 `GET /api/v1/foo`가 생겼을 때. 학식 파일을 옆에 열어두고 같은 모양으로 만드세요.

1. **Entity** — `domain/entities/Foo.ts`
   화면에 필요한 필드만 가진 `interface Foo`와 기본값을 채워주는 `createFoo()`를 만듭니다. 백엔드 필드명을 그대로 쓸 필요는 없습니다(예: `Cafe`는 `cafeteriaCode`가 아니라 `id`).
2. **Repository 인터페이스** — `domain/repositories/IFooRepository.ts`
   `getFoo: () => Promise<Foo[]>`처럼 Entity를 돌려주는 계약만 적습니다.
3. **Schema (필요할 때만)** — `data/schemas/FooSchema.ts`
   응답 `data`의 모양을 zod로 적습니다. 기준 파일: `MenuSchema.ts`, `ShuttleSchema.ts`. 단순한 응답이면 이 단계를 건너뜁니다([Repository 작성 규칙](#repository-작성-규칙) 참고).
4. **DataSource** — `data/datasources/FooApiDataSource.ts`
   ```ts
   export const createFooApiDataSource = ({ httpClient }: { httpClient: HttpClient }): FooApiDataSource => ({
     getFoo: async () => parseOrThrow(await httpClient.get('/api/v1/foo')),
   });
   ```
   반환 타입은 `Promise<ApiResponse<unknown>>`. 검증 전이라 `unknown`입니다.
5. **Repository 구현** — `data/repositories/FooRepository.ts`
   아래 [Repository 작성 규칙](#repository-작성-규칙)을 따릅니다.
6. **UseCase** — `domain/usecases/GetFooUseCase.ts`
   `execute: () => fooRepository.getFoo()` 한 줄이면 충분합니다. 여러 Repository를 조합할 때만 로직이 들어갑니다.
7. **di.ts에 등록**
   DataSource → Repository → UseCase 순으로 한 줄씩 추가합니다. 새 백엔드(`/api/v1/*`)는 `apiHttpClient`, 남아 있는 Vercel BFF(`/api/*`, 공공버스 등)는 `httpClient`를 넘깁니다.
8. **Hook** — `presentation/hooks/useFoo.ts`
   아래 [Hook 작성 규칙](#hook-작성-규칙)을 따릅니다.
9. **Component**에서 훅을 호출해 그립니다. 탭 화면이면 `isActive`를 훅에 넘깁니다.
10. **테스트** — 훅 단위 테스트를 `useFoo.test.ts`로 옆에 둡니다(기준: `useMenu.test.ts`).

## Repository 작성 규칙

기준 파일: `MenuRepository.ts`, `ShuttleRepository.ts`, `LibraryRepository.ts`.

```ts
const AREA = '학식'; // Sentry 태그용 한글 이름표

export const createMenuRepository = ({ menuApiDataSource }) => ({
  getMenuForPeriod: () => withAreaTag(AREA, async () => {
    const res = await menuApiDataSource.getMenuForPeriod();
    // 1. success:false → 에러
    if (!res.success)
      throw apiError(res.error?.message || `menu API returned 'success:false'`, { area: AREA, endpoint: res._requestUrl });
    // 2. 구조가 틀림 → 에러   3. 항목 하나가 틀림 → 그 항목만 버림
    ...
  }),
});
```

- **메서드 전체를 `withAreaTag(AREA, ...)`로 감쌉니다.** 네트워크·HTTP 에러까지 Sentry에서 어느 기능인지 보이게 하기 위해서입니다.
- **에러는 `apiError(message, { area, endpoint })`로 던집니다.** `endpoint`에는 `res._requestUrl`을 넣습니다.
- **검증은 세 단계로 나눕니다.**
  1. `success: false` → 던진다.
  2. 응답 구조 자체가 틀림(배열이어야 하는데 아님 등) → 던진다. 조용히 빈 값으로 바꾸면 진짜 장애와 "오늘 데이터 없음"이 구분되지 않습니다.
  3. 배열 안 항목 하나가 이상함 → 그 항목만 `safeParse`로 걸러내고 나머지는 보여준다. 그래서 상위 스키마에 항목 스키마를 중첩하지 않고 Repository에서 항목별로 parse합니다.
- **"구조상 절대 비어 있을 수 없는" 데이터가 비면 에러로 취급합니다.** 예: 셔틀 시간표, 도서관 열람실. 반대로 "없을 수도 있는" 데이터는 빈 값이 정상입니다. 예: 특정 날짜의 학식 → `createEmptyCafes()`.
- **모르는 enum 값은 에러가 아닙니다.** 라벨 매핑(`ROUTE_LABEL[d.route] ?? d.route`)에서 원본 값을 그대로 통과시킵니다. 그래서 스키마에서도 enum이 아니라 `z.string()`으로 받습니다. 백엔드에 새 값이 추가돼도 앱이 깨지지 않게 하기 위해서입니다.
- **선택 필드 기본값은 Repository에서 채웁니다.** 예: `placement: banner.placement ?? 'BOTH'`.
- **zod는 검증이 의미 있을 때만 씁니다.** 필드가 많거나, 항목별로 걸러내야 하거나, 깨졌을 때 화면이 크게 틀어지는 응답(학식·셔틀·도서관)에는 Schema 파일을 만듭니다. 응답이 단순하고 틀려도 피해가 작으면(배너) `Array.isArray` 정도의 가벼운 확인으로 충분합니다. 이 경우 Schema 파일은 만들지 않습니다.

## Hook 작성 규칙

기준 파일: `useWeather.ts`(가장 단순), `useMenu.ts`, `useShuttle.ts`.

```ts
const WEATHER_STALE_TIME = 600000; // 10분 (백엔드 weatherSummary 캐시 TTL과 일치)
const WEATHER_QUERY_KEY = ['portal', 'weather'];

export function prefetchWeather() { /* 같은 key·queryFn·staleTime */ }

export function useWeather(isActive = true) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: WEATHER_QUERY_KEY,
    queryFn: () => getWeatherUseCase.execute(),
    staleTime: WEATHER_STALE_TIME,
    enabled: isActive,
  });
  return { weather: data ?? null, loading: isLoading, error, refetch: () => { refetch(); } };
}
```

- **queryKey와 staleTime은 파일 맨 위 상수로 둡니다.** 이름은 `<기능>_QUERY_KEY`, `<기능>_STALE_TIME`. queryKey는 `['탭', '기능']` 또는 `['기능']` 배열입니다.
- **staleTime 옆에는 근거를 주석으로 적습니다.** 대부분 "백엔드 캐시 TTL·갱신 주기와 맞춤"이 근거입니다. 값을 정하는 기준과 현재 값 목록은 [caching.md](caching.md)를 봅니다. 따로 안 적으면 전역 기본값 15분이 적용됩니다.
- **`isActive`를 받아서 `enabled`로 넘깁니다.** 탭은 숨겨질 뿐 언마운트되지 않기 때문에, 보이지 않는 탭에서 요청이 나가지 않게 하려는 것입니다.
- **앱 시작 시 미리 받아야 하면 `prefetch<기능>()`을 같이 export합니다.** key·queryFn·staleTime은 훅과 똑같아야 합니다. 부팅을 막는 필수 로딩이면 먼저 [src/BOOT_ARCHITECTURE.md](../../src/BOOT_ARCHITECTURE.md)를 읽으세요.
- **반환값은 화면이 쓰기 좋은 이름으로 풀어서 돌려줍니다.** `{ weather, loading, error, refetch }`처럼 씁니다. `refetch`는 `() => { refetch(); }`로 감싸서 Promise를 숨깁니다.
- **실시간 데이터는 폴링 조건을 명시합니다.** 공공버스(`usePublicBus`)는 `refetchInterval: 30초`에, 화면이 보이고 3분 안에 사용자 활동이 있을 때만 폴링합니다. 어차피 곧 다시 폴링하므로 `retry: 0`입니다.
- **전역 `refetchOnWindowFocus`는 꺼져 있습니다.** 앱 복귀 시 다시 받아야 하는 데이터만 훅 안에서 `visibilitychange`를 직접 구독합니다(`useMenu`, `usePublicBus`).
- **데이터가 바뀌는 시점을 알 수 있으면 staleTime을 기다리지 말고 `invalidateQueries`로 직접 무효화합니다.** 예: `useShuttle`은 학기·요일 구분이 바뀌는 순간 시간표를 다시 받습니다.

## ⚠️ 응답 모양을 바꿀 때 (백엔드 변경 시 필독)

TanStack Query 캐시는 `localStorage`(`hyu_rq_cache`)에 24시간 저장되고, 앱을 다시 열면 **매퍼를 거치지 않고 그대로 복원**됩니다. 그래서 Entity 모양이 바뀌면 옛 캐시가 새 코드로 흘러들어 화면이 조용히 깨집니다.

- Entity의 필드 이름·중첩 구조·값의 의미가 바뀌거나 필수 필드가 늘면 → `src/lib/queryClient.ts`의 `CACHE_BUSTER`를 올리고, 그 위 주석에 무엇이 바뀌었는지 한 줄 남깁니다.
- 선택 필드 추가, staleTime 조정, UI 변경 → 올릴 필요 없습니다.
- 로컬 개발 중 옛 모양이 보이면 개발자 도구에서 `localStorage`의 `hyu_rq_cache`를 지우고 새로고침합니다.

## 에러 처리와 모니터링

- HTTP 요청은 반드시 `HttpClient`를 거칩니다. 컴포넌트·훅에서 `fetch`를 직접 부르지 않습니다. 15초 타임아웃, 에러 객체에 `statusCode`·`code`·`endpoint` 붙이기가 여기서 처리됩니다.
- 백엔드 공통 응답은 `{ success, data, error?: { code, message } }`(`ApiResponse<T>`)를 가정합니다. HTTP 4xx/5xx는 `parseOrThrow`가 던지고, `success: false`는 Repository가 판단합니다.
- 쿼리 실패의 Sentry 전송은 `queryClient.ts`의 전역 `onError`가 한 곳에서 합니다. 각 훅에서 `captureException`을 부르지 않습니다. 장애가 아닌 정상 에러 응답(예: 429 요청 제한)은 거기에 예외로 추가합니다.
- 재시도는 전역 기본값(최대 2번, 타임아웃이나 당겨서 새로고침 중엔 안 함)을 따르고, 폴링 데이터만 `retry: 0`으로 끕니다.

## TypeScript · 파일 · 주석

- 새 파일은 **TypeScript**(`.ts`/`.tsx`)로 만듭니다.
- **import 경로에는 `.js` 확장자를 붙입니다.** 실제 파일이 `.ts`여도 `import { useMenu } from './useMenu.js'`처럼 씁니다. 기존 코드가 전부 이 방식입니다.
- 생성은 클래스가 아니라 **팩토리 함수**로 합니다: `create<이름>DataSource`, `create<이름>Repository`, `createGet<이름>UseCase`. 의존성은 객체 하나로 받습니다(`({ menuRepository }) => ...`).
- 파일명: 훅 `useXxx.ts`, 컴포넌트 `XxxView.tsx`·`XxxCard.tsx`(PascalCase), 컴포넌트 전용 순수 함수는 같은 폴더의 camelCase `.ts`(예: `cafeteriaSchedule.ts`).
- 파일 첫 줄에 `// 레이어: 무엇을 하는지` 주석을 답니다(예: `// 레포지토리: 학식 API 응답을 Cafe 엔티티 배열로 변환`).
- 주석은 한국어로 쓰고, **무엇을 하는지보다 왜 그렇게 했는지**를 적습니다. 값의 근거(백엔드 TTL 등), 일부러 관대하게/엄격하게 처리한 이유, 과거에 겪은 문제를 남깁니다.
- `localStorage` 키는 snake_case 문자열을 씁니다(예: `shuttle_stop`, `public_bus_favorites`).

## 검증 명령

PR 전에 다음 세 가지를 통과시킵니다.

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm test            # vitest
```

훅 테스트는 `globalThis.fetch`를 목으로 바꾸고 `QueryClientProvider`로 감싸 `renderHook`합니다(기준: `useMenu.test.ts`, `useBanners.test.ts`).

## 브랜치 전략

- `main`: 배포된 코드. 직접 push하지 않습니다.
- `develop`: 다음 배포에 들어갈 코드. 작업 브랜치는 여기서 따고 여기로 PR합니다.
- 작업 브랜치 이름: `<타입>/<짧은-설명>` (예: `feat/campus-printer`, `fix/feedback-20261030`, `refactor/shuttle-view`, `docs/ai-context`).- `develop` → `main`으로 합쳐 배포하는 흐름은 [release.md](release.md)에 있습니다.

## 커밋 컨벤션

`타입(범위): 한국어 요약` 형식입니다. 범위는 생략할 수 있습니다.

```
fix(cafeteria): 학식 staleTime 1시간 → 10분, 학식 탭에서 앱 복귀 시 재검증
feat(campusMap): 프린터 레이어·프린터 API 연동 + 메뉴 검색
```

- 타입: `feat` `fix` `refactor` `perf` `style` `docs` `test` `chore` `release`
- 범위 예: `cafeteria`/`menu`, `shuttle`, `library`, `weather`, `banner`, `campusMap`, `misc`, `playlist`, `query`

## PR 규칙
정해진 규칙은 따로 없습니다. `develop`으로 PR을 올리고, 위 [검증 명령](#검증-명령)을 통과시키면 됩니다.

## 상태 관리 · 데이터 패칭
- 서버 데이터는 TanStack Query 캐시가 단일 출처입니다. 서버 응답을 `useState`에 복사해 따로 들고 있지 않습니다(예외: 공공버스 카운트다운처럼 받은 값을 매초 가공해야 할 때).
- 앱 전역 설정·부팅 상태는 Context(`BootContext`)에 둡니다.
- 사용자 선택값(정류장, 즐겨찾기 등)은 `useState` + `localStorage`로 유지합니다.

## 스타일링 · 디자인 토큰

지금 코드에는 Tailwind, 인라인 `style={{}}`, CSS Module이 섞여 있습니다. 새 코드는 아래 순서로 고릅니다.

### 1. 기본은 Tailwind 클래스
- 색·모서리·폰트는 `tailwind.config.js`의 **토큰을 먼저 씁니다.** hex 값을 직접 쓰지 않습니다.

  | 용도 | 토큰 |
  |---|---|
  | 본문 / 보조 / 힌트 글자 | `text-text-main` / `text-text-sub` / `text-text-hint` |
  | 브랜드 파랑 / 금색 | `primary` (`#0E4A84`) / `secondary` |
  | 배경 | `bg-surface` |
  | 상태 | `success` / `warning` / `error` |
  | 카드 모서리 | `rounded-card` (12px) |
  | 앱 최대 너비 | `max-w-app` (440px) |

- 같은 임의값(`#e2e8f0`, `shadow-[...]` 등)이 여러 곳에서 반복되면 `tailwind.config.js`에 토큰으로 올립니다. 예: 플레이리스트 강조색 `playlist-primary`.
- 슬레이트 계열 회색(`slate-200` 등)은 Tailwind 기본 팔레트를 그대로 씁니다.

### 2. 런타임에 계산되는 값만 인라인 `style`
- 실행 중에 바뀌는 값만 `style={{}}`로 씁니다. 예: 진행률 `width: ${n}%`, 캐러셀 `transform`, JS 상수로 계산한 높이, `animationDelay`.
- 고정 값을 `style={{ fontSize: 13, color: '#...' }}`로 쓴 기존 코드가 있지만 예전 방식입니다. 따라 하지 말고 Tailwind로 씁니다.
- 인라인에서 색이 필요하면 `index.css`의 CSS 변수(`var(--color-primary)`, `var(--color-text-hint)`)를 씁니다.

### 3. Tailwind로 표현이 안 될 때만 CSS 파일
- `::before`/`::after`, `@keyframes`, `perspective`, `grid-template-rows` 트랜지션 같은 경우입니다.
- **그 컴포넌트에서만 쓰면** 같은 폴더에 `Xxx.module.css`를 둡니다(예: `TimetableRow.module.css`, `GymView.module.css`).
- **여러 곳에서 쓰면** `src/index.css`에 둡니다. 공용 애니메이션(`fadeIn`, `slideUp`, `sheetUp` 등), `.skeleton-shimmer`, `.accordion-content`가 이미 여기 있으니 새로 만들기 전에 먼저 찾아봅니다.

### 이미 있는 UI 부품
새로 만들기 전에 `src/presentation/components/ui/`부터 확인합니다.

| 필요한 것 | 쓸 것 |
|---|---|
| 바텀시트 | `ModalBottomSheet`, `StandardBottomSheet` |
| 접히는 영역 | `Accordion` |
| 상단 안내 배너 | `NoticeBanner` |
| 휠 선택기 | `TimeDayWheelPicker`, `CollegeWheelPicker`, `WheelColumnView` |
| lazy 로딩 중 자리 | `SuspenseFallback` |
| 카드 로딩 상태 | 화면별 `XxxViewSkeleton.tsx` + `.skeleton-shimmer` 클래스 (예: `ClubViewSkeleton.tsx`) |
| 카드 에러 상태 | `common/CardFallback` |

### 화면 규칙
- **모바일 전용 레이아웃**입니다. 앱 컨테이너 너비는 `max-w-app`(440px), 높이는 `100vh`가 아니라 `100dvh`입니다.
- 노치·홈 인디케이터 영역은 `env(safe-area-inset-top/bottom)`으로 비웁니다(예: `bottom-[calc(24px+env(safe-area-inset-bottom))]`).
- **다크 모드는 지원하지 않습니다.** `dark:` 클래스를 쓰지 않습니다.
- **글래스(반투명 흐림) 느낌**은 `bg-surface/90 backdrop-blur-xl` 또는 `bg-white/NN backdrop-blur-*` 조합입니다. 상단 고정 헤더는 `CafeteriaView`·`ClubView`의 sticky 헤더 클래스를 그대로 가져다 씁니다.
- 폰트는 Pretendard 400·500·600·700만 있습니다. `font-extrabold`·`font-black`을 써도 700으로 보입니다.
- 텍스트 선택과 길게 누르기 메뉴는 전역에서 꺼져 있습니다(앱처럼 보이게). 입력창만 예외입니다.

## 테스트 도구
- 단위: Vitest (`vitest.config.js`)
- E2E: Playwright (`playwright.config.js`, `e2e/`)
- 컴포넌트: Storybook (`.storybook/`)
