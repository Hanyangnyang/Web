# 하냥냥 (Hanyangnyang) 프로젝트

한양대학교 학생 커뮤니티 앱. Capacitor 기반 하이브리드 앱으로 Android / iOS 동시 지원.

서비스 소개·기능 기획 의도·타겟 유저는 private 레포 `Hanyangnyang/Context`의 `context/app-overview.md`, `context/features.md`가 원본입니다.

## 기술 스택

- **프론트엔드**: React + Vite (Capacitor WebView로 래핑)
- **Android**: Capacitor + Java (Kotlin 전환 예정)
- **iOS**: Capacitor (Codemagic으로 빌드)
- **백엔드**: 자체 백엔드 서버(Spring Boot) — 학식·날씨·도서관 혼잡도·배너·헬스장·지하철·셔틀·제휴매장·통합피드백·학사달력(공휴일 포함)까지 대부분의 핵심 데이터를 여기서 서빙 (CORS 차단·API Key 보호 역할도 겸함)
- **BFF / API**: Vercel Serverless Functions — 공공버스 도착정보, 인스타그램 프로필 사진 정적 이미지 주기 갱신(Cron)만 남음. 학식·날씨·도서관·지하철·셔틀·공휴일은 전부 위 백엔드로 이전 완료
- **DB / Auth**: Supabase — 익명 Auth, FCM 구독·알림 설정(subscriptions·devices), app_config(다가오는 시간표 변경 배너용 period_schedule만 남음 — 나머지 셔틀 설정은 새 백엔드 `/api/v1/academic/status`로 이전). 앱 내 배너 자체는 더 이상 Supabase가 아니라 새 백엔드 `/api/v1/banners`가 서빙
- **푸시 알림**: Firebase Cloud Messaging (FCM) — Capacitor 네이티브(Android/iOS) + Web 동시 지원
- **에러 모니터링**: Sentry (@sentry/capacitor + @sentry/react, 프로덕션 빌드에서만 활성화)
- **사용자 분석**: PostHog
- **외부 API**: (백엔드 서버에서 호출) Open-Meteo(날씨·대기질), 서울 열린데이터(지하철), 공공데이터포털(공휴일), 한양대 도서관 API, Google Gemini(날씨 코멘트 AI 생성) / (Vercel에서 호출) 경기도 버스정보시스템, Instagram API, GitHub Contents API

## 다른 문서 — 작업 전에 해당 문서를 먼저 읽을 것

| 언제 | 문서 |
|---|---|
| 구조·데이터 흐름·API·Supabase를 알아야 할 때 | [docs/dev/architecture.md](docs/dev/architecture.md) |
| 앱 시작 시 필수 비동기 로딩을 추가할 때 | [src/BOOT_ARCHITECTURE.md](src/BOOT_ARCHITECTURE.md) — `BootContext`의 `readyMap`/`markReady` 패턴, 과거 무한 스플래시 버그 사례 포함. **반드시 먼저 확인** |
| 푸시 알림을 고칠 때 | [docs/dev/push-notifications.md](docs/dev/push-notifications.md) |
| 코드 작성·커밋·PR | [docs/dev/conventions.md](docs/dev/conventions.md) |
| 배포할 때 | [docs/dev/release.md](docs/dev/release.md) |
| Android/iOS/Capacitor 이슈 | [docs/dev/platform-pitfalls.md](docs/dev/platform-pitfalls.md) |
| PostHog 이벤트를 추가·수정할 때 | [docs/dev/analytics.md](docs/dev/analytics.md) |
| A/B 테스트 구현 | [docs/dev/experiments/](docs/dev/experiments/) |
| 캐싱·데이터 페칭 | [docs/dev/caching.md](docs/dev/caching.md) |
| 환경변수 | [docs/dev/env.md](docs/dev/env.md) |
| 제거된 기능을 복원할 때 | [docs/dev/removed-features.md](docs/dev/removed-features.md) |
| 장애·버그 기록 | [docs/dev/incidents.md](docs/dev/incidents.md) |
| 기술 결정 기록 (왜 지금 코드가 이렇게 생겼는가) | [docs/dev/decisions/](docs/dev/decisions/) |

## 기획 맥락 (private 레포)

기획 의도·유저 인사이트·지표 정의·브랜드 톤은 private 레포 `Hanyangnyang/Context`에 있습니다. 로컬에 clone돼 있으면(예: `ClaudeCowork/HanyangnyangContext`) 그 레포의 `AGENTS.md`부터 읽으세요. **이 레포는 public이므로 Context 레포 내용(유저 데이터, 전략, 개인 기록)을 여기로 복사하지 마세요.**

## 개발 원칙

- 코드 작성은 Claude Code와 함께, **개념 이해는 본인이 직접** — 면접에서 설명할 수 있어야 포트폴리오가 됨
- 모든 리팩토링/최적화는 **"측정 → 개선 → 수치"** 순서 — 계측(PostHog·Lighthouse·Profiler)을 항상 먼저
- Android 위젯 → Mac 세팅 → iOS 위젯 **순서 필수** (동시 진행 시 둘 다 느려짐)
- CI/CD는 9월 배포 전까지만 완성되면 됨
- 채팅은 백엔드 준비 상태 확인 후 착수 시점 결정

## 로드맵

**작업 우선순위의 단일 기준은 [docs/frontend-roadmap.md](docs/frontend-roadmap.md)** — FE 직무 포트폴리오 관점의 작업 단위 로드맵 (문제 스토리 · 해결 · 증빙 지표 · 체크리스트 포함). 리팩토링/최적화 작업 시작 전 반드시 이 문서를 먼저 확인하고, 완료 시 체크리스트를 갱신할 것.

요약 (2026-07 기준):

| 시기 | 작업 |
|------|------|
| 7월 | 폴링 캐시 완성(진행 중) → 위치정보 UX → 스크롤 분리 → TanStack Query 마이그레이션 → 번들·폰트·CWV 최적화 |
| 8월 | Android 위젯 (병렬 트랙, ~2주) ∥ TypeScript 점진 전환 병행 |
| 9월~ | 컴포넌트 분해·Storybook → Next.js 웹(검색용 경로) + 모노레포 |
| 9월 배포 전 | CI/CD (Android GitHub Actions) |
| 이후 | iOS 위젯 (Mac 세팅 후), 실시간 채팅 (백엔드 준비 후) |
