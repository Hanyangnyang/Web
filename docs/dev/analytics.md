# PostHog 이벤트 구현

이벤트 이름, 속성, 어디서 보내는지를 적습니다. **무엇을, 왜 재는지(지표 정의)** 는 private 레포 `Hanyangnyang/Context`의 `context/insights/analytics.md`에 있습니다.

## 공통 설정
- `src/main.tsx`에서 `posthog.init()` 직후 `posthog.register({ environment: import.meta.env.MODE })`를 호출합니다. 모든 이벤트에 `environment: 'development' | 'production'`이 붙습니다.
- 태그만으로는 자동으로 걸러지지 않습니다. PostHog 인사이트·실험 필터에 `environment = production`을 직접 추가해야 합니다.

## 이벤트 목록
| 이벤트명 | 속성 | 보내는 위치 | 대응 지표 |
|---|---|---|---|
|  |  |  |  |

<!-- TODO: 이벤트 네이밍 규칙, 리네임 이력 -->

## Sentry
<!-- TODO: docs/sentry-coverage.md 링크 + 요약 -->

## 성능 기준값
<!-- TODO: Lighthouse, CWV, 번들 크기 베이스라인과 측정 방법 -->

A/B 테스트 이벤트는 [experiments/](experiments/)의 실험별 문서에 있습니다.
