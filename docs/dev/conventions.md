# 코드 컨벤션

## 코드 스타일
- (ESLint 설정: 루트 `eslint.config.js`)
- 네이밍 규칙:
- 레이어 규칙: Clean Architecture — `presentation` → `domain` ← `data`, 의존성 주입은 `src/di.ts` ([architecture.md](architecture.md) 참고)
<!-- TODO: 파일/컴포넌트 네이밍, 새 파일은 JS/TS 중 무엇으로 -->
<!-- TODO: presentation / domain / data / infrastructure / lib 각 레이어가 하는 일과 하면 안 되는 일 -->

## 새 기능 추가 순서
<!-- TODO: Entity → Repository 인터페이스 → DataSource → Repository → UseCase → di → Hook 예시 -->

## 상태 관리 · 데이터 패칭
<!-- TODO: Context, 폴링 캐시, TanStack Query 전환 이후 규칙 (캐시 정책은 caching.md) -->

## 스타일링 · 디자인 토큰
<!-- TODO: 리퀴드 글래스 리뉴얼 이후 기준 -->

## 브랜치 전략
- (예: main / develop / feature-* — 실제 전략을 채워주세요)
<!-- TODO: develop / main 관계, PR 흐름, revert 함정 -->


## 커밋 컨벤션
- (예: feat/fix/docs/refactor 접두사)

## PR 규칙
- (예: 최소 1인 리뷰 후 머지, 셀프 머지 금지 등)

## 테스트
- 단위: Vitest (`vitest.config.js`)
- E2E: Playwright (`playwright.config.js`, `e2e/`)
- 컴포넌트: Storybook (`.storybook/`)
