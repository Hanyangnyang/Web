# 하냥냥 (Hanyangnyang) 프로젝트

한양대학교 학생 커뮤니티 앱. Capacitor 기반 하이브리드 앱으로 Android / iOS 동시 지원.

## 기술 스택

- **프론트엔드**: React + Vite (Capacitor WebView로 래핑)
- **Android**: Capacitor + Java (Kotlin 전환 예정)
- **iOS**: Capacitor (Codemagic으로 빌드)
- **백엔드**: Vercel (Java/Node 전환 예정)
- **분석**: PostHog (이미 연동됨)

## 개발 원칙

- 코드 작성은 Claude Code와 함께, **개념 이해는 본인이 직접** — 면접에서 설명할 수 있어야 포트폴리오가 됨
- Android 위젯 → Mac 세팅 → iOS 위젯 **순서 필수** (동시 진행 시 둘 다 느려짐)
- CI/CD는 9월 배포 전까지만 완성되면 됨
- 채팅은 백엔드 준비 상태 확인 후 착수 시점 결정

## 고도화 로드맵

### Phase 1 — 기반 정비 (약 1주)

| 작업 | 이유 |
|------|------|
| PostHog 측정 지표 추가 | 이미 연동됨. 고도화 전 지표만 보강 |
| Java → Kotlin 전환 | MainActivity, WebViewActivity 2개 파일 |
| PWA Service Worker 캐싱 | vite.config.js에 runtimeCaching 추가 |
| 번들 분석 (vite-bundle-visualizer) | React 고도화 전 측정 먼저 |

### Phase 2 — React 고도화 (약 1주)

- 탭 지연 마운트 + React.memo 적용
- 이미지 lazy loading
- useMemo 병목 구간 적용
- Service Worker 적용 확인 + 오프라인 테스트

### Phase 3 — Android 위젯 개발 (약 2주)

- AppWidgetProvider + RemoteViews 기본 위젯
- WorkManager 주기적 갱신 + WidgetRepository (API 직접 호출)
- SharedPreferences 앱 ↔ 위젯 데이터 연동
- 딥링크 연결 + 트러블슈팅 (Doze Mode, 데이터 불일치 등)

> **이 시점에 Clean Architecture 도입.** 위젯이 Data / Domain / Presentation 레이어가 실제로 생기는 첫 시점.

### Phase 4 — Mac 환경 구축 + Swift 기초 (약 1주)

- Xcode 설치 + Capacitor iOS 빌드 환경 세팅
- Apple 인증서 + Provisioning Profile 이전 (제일 많이 막히는 구간, AI가 대신 못 해줌)
- 로컬 빌드 + 기기 테스트
- Swift 기초 훑기 (iOS 위젯 디버깅 위해 문법 읽는 수준)
- Codemagic 완전 대체 or 병행 결정

### Phase 5 — iOS 위젯 개발 (약 2–3주)

Android와 완전히 다른 생태계. WidgetKit + SwiftUI + App Groups.

- WidgetKit + TimelineProvider 구조 이해
- App Groups 설정 (메인 앱 ↔ 위젯 데이터 공유)
- 위젯 UI 구현 (SwiftUI)
- 갱신 전략 + 트러블슈팅

### Phase 6 — 실시간 채팅 (약 2–4주, 백엔드 준비 후)

선행 조건: 백엔드 Vercel → Java/Node 전환 완료 시점 확인 필요.

- 채팅 UI (React, Supabase Realtime or WebSocket)
- ChatMessagingService (FCM 채팅 전용 알림)
- NotificationChannel + RemoteInput 인라인 답장
- Native ↔ WebView 알림 동기화 트러블슈팅

### Phase 7 — CI/CD 자동화 (약 3–4일, 9월 배포 직전)

- Android GitHub Actions (Gradle 빌드 + APK 자동화)
- iOS 빌드 파이프라인 (Mac 환경 구축 완료 후)

### Phase 8 — Unit/E2E Test (필요 시)

채팅처럼 복잡한 기능이 안정화된 후 고려. 지금 당장 우선순위 아님.

## 전체 타임라인

| 시기 | 작업 |
|------|------|
| Week 1 | Phase 1 기반 정비 + Phase 2 React 고도화 |
| Week 2–3 | Phase 3 Android 위젯 |
| Week 4 | Phase 4 Mac 환경 구축 + Swift 기초 |
| Week 5–7 | Phase 5 iOS 위젯 |
| Week 6–9 | Phase 6 실시간 채팅 (iOS 위젯과 병행) |
| 9월 배포 전 | Phase 7 CI/CD |
| 여유 시 | Phase 8 테스트 |
