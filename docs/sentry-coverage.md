# Sentry 캡처 현황

정리일: 2026-08-24. 프론트엔드에서 Sentry로 실제 정보가 전달되는 지점을 전수 정리한 문서. `console.error`/`catch`를 새로 추가하거나 캡처 커버리지를 감사할 때 여기부터 갱신할 것.

## 초기화 / 자동 캡처

- [src/lib/sentry.ts](../src/lib/sentry.ts) — `Sentry.init()`, 프로덕션에서만 활성화. `browserTracingIntegration()`으로 성능 추적도 같이 켜져 있음. 이 SDK 초기화 하나로 **전역 JS 에러 / unhandled promise rejection은 별도 코드 없이 자동 캡처**됨(SDK 기본 동작이라 코드에 안 보임).

## 렌더링 크래시

- [ErrorBoundary.tsx:30](../src/presentation/components/common/ErrorBoundary.tsx#L30) — `app-root`(main.tsx 최상단), `PortalView`, `CafeteriaView`, `ShuttleView` 등 여러 곳에 배치된 경계에서 렌더 중 예외 캡처. `tags.boundary`로 어느 경계인지, `extra.componentStack`으로 스택 구분.

## 데이터 페칭 (React Query)

- [queryClient.ts:18](../src/lib/queryClient.ts#L18) `QueryCache.onError` — 모든 `useQuery` 최종 실패(재시도 소진 후), `tags.queryKey`로 구분. 프로덕션+온라인일 때만.
- [queryClient.ts:31](../src/lib/queryClient.ts#L31) `MutationCache.onError` — 모든 `useMutation` 실패(예: 피드백 제출), `tags.mutationKey`로 구분.

## FCM 푸시 알림

- [firebase.ts:64](../src/lib/firebase.ts#L64) `fcm-native-register` — 네이티브 푸시 등록/토큰 발급 실패
- [firebase.ts:98](../src/lib/firebase.ts#L98) `fcm-request-permission` — 알림 권한 요청 실패(웹/네이티브 공통)
- [firebase.ts:124](../src/lib/firebase.ts#L124) `fcm-check-permission` — 알림 권한 체크 실패

## 알림 구독 (Supabase RPC)

- [useAlarmSubscription.ts:97](../src/presentation/hooks/useAlarmSubscription.ts#L97) `alarm-subscription-sync` — 서버 구독 상태 조회 실패
- [useAlarmSubscription.ts:155](../src/presentation/hooks/useAlarmSubscription.ts#L155) `alarm-subscription-enable` — 구독 켜기 저장 실패
- [useAlarmSubscription.ts:178](../src/presentation/hooks/useAlarmSubscription.ts#L178) `alarm-subscription-disable` — 구독 끄기 저장 실패
- 셋 다 `tags.topic`으로 학식/날씨 알림 중 어느 쪽인지 구분.
- ⚠️ 알려진 한계: 구독 켜기(enable)가 실패해도 UI엔 이미 성공 메시지가 뜬 뒤라, 사용자는 성공으로 착각할 수 있음. Sentry엔 잡히지만 UX 자체를 고치는 작업은 아직 안 함.

## 부팅 설정

- [BootContext.tsx:111](../src/presentation/context/BootContext.tsx#L111) `boot-app-config` — 앱 시작 시 `app_config`(점검 메시지·최소 버전·학기 판정) 조회 실패

## 카카오톡 공유

- [kakao.ts:62](../src/lib/kakao.ts#L62) `kakao-sdk-init` — SDK init 자체 실패
- [ShareSheet.tsx:66](../src/presentation/components/cafeteria/ShareSheet.tsx#L66) `kakao-share-load` — 공유 시트에서 SDK 로드 실패(`tags.status`로 NO_KEY/INIT_ERROR/SDK_NOT_LOADED 구분)
- [ShareSheet.tsx:98](../src/presentation/components/cafeteria/ShareSheet.tsx#L98) `kakao-share-send` — 실제 공유 전송(`Share.sendDefault`) 실패
- `ShareSheet.tsx`의 마운트 시 프리페치(`loadKakaoSdk().catch(() => {})`)는 의도적으로 캡처 안 함 — 실패해도 클릭 시 재시도되고, 그때 위 `kakao-share-load`가 잡으므로 중복 리포트 방지.

## 푸시 알림 딥링크

- [App.tsx:182](../src/App.tsx#L182) `push-deeplink-parse` — 알림 탭 시 딥링크 URL 파싱 실패

## 기타

- [useLocation.ts:76](../src/presentation/hooks/useLocation.ts#L76) — 셔틀 지오로케이션 실패 (`captureMessage`, warning 레벨)

## 아직 안 잡힌 지점

- **우선순위 중간, 미착수**: [PartnershipView.jsx:202](../src/presentation/components/partnership/PartnershipView.jsx#L202) — `partnerships.json` 정적 파일 로드 실패 시 탭 전체가 빈 화면으로. 아직 Sentry 캡처 없음.
- **의도적 스킵**: [firebase.ts:30](../src/lib/firebase.ts#L30) (`initMessaging`의 `isSupported()` 실패) — 브라우저가 Push API 자체를 지원 안 하는 정상 분기라, 캡처하면 노이즈만 쌓임.
- **우선순위 낮음**: [InstagramRepository.ts:33](../src/data/repositories/InstagramRepository.ts#L33) — Instagram API 폴백 실패해도 이미 graceful fallback(기본 아바타로 대체)이라 사용자 경험엔 지장 없음. 필요하면 warning 레벨로 가볍게 추가 가능.
