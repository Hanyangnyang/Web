# 푸시 알림 (FCM) 흐름

웹·Android·iOS·Supabase에 걸친 알림 설정부터 배달까지의 흐름입니다.

## ① 사용자가 알림 설정

```
앱 실행
  ↓
Supabase 익명 로그인 → device_id 발급 (UUID)
  ↓
OS/브라우저에 알림 권한 요청

  [네이티브 앱 - Android/iOS]
  PushNotifications.register() → OS가 FCM 서버에 기기 등록
  FCM.getToken() → 네이티브 FCM 토큰 발급

  [PWA / 브라우저]
  getToken(messaging, { vapidKey }) → VAPID 키 기반 웹 푸시 토큰 발급
  ↓
토큰 + 설정(시간·키워드·식당) → Supabase RPC 호출
  → devices 테이블      : { device_id, fcm_token, platform }
  → subscriptions 테이블 : { device_id, topic, notifyTime, params, is_active }
```

## ② 알림 발송 (Supabase Edge Function)

```
Supabase Cron (대시보드 설정)
  → 매 1분마다 Edge Function(menu-alerts) 자동 호출
  → JWT service_role 검증으로 외부 호출 차단
  ↓
현재 KST 시각 확인
  ↓
Supabase DB 조회:
  subscriptions JOIN devices
  WHERE is_active = true AND notifyTime = 현재시각
  → 구독자 목록 + FCM 토큰 + platform
  ↓
토픽별 분기:

  [CAFETERIA_KEYWORD - 학식 알림]
  Vercel /api/menu 호출 → 오늘/내일 학식 데이터
  cafe 모드   : 선택한 식당 메뉴 → 알림 본문 조립
  keyword 모드 : 키워드 포함 메뉴 있을 때만 → 알림 본문 조립

  [WEATHER_ALERT - 날씨 알림]
  Vercel /api/portal?type=weather 호출
  비/눈·미세먼지·자외선 조건 체크 → 알림 본문 조립
  ↓
플랫폼별 FCM 메시지 페이로드 조립:
  네이티브 : notification + apns(iOS전용) + android 필드 포함
  웹(PWA)  : data-only (SW 이중 알림 방지를 위해 notification 제외)
  ↓
Firebase Admin SDK (Edge Function 내 npm 라이브러리)
  → 인증 키는 Supabase Secrets에 저장 (FIREBASE_PRIVATE_KEY 등)
  → FCM 서버 API 호출 (최대 500개씩 배치 병렬 발송)
```

## ③ FCM 서버 → 각 기기 배달

```
FCM 서버
  ├─ Android → FCM 직접 전달 → OS → 시스템 알림 표시  (앱 꺼져도 수신 ✅)
  ├─ iOS     → APNs(Apple) 경유 → OS → 시스템 알림    (앱 꺼져도 수신 ✅)
  └─ PWA     → Web Push → 브라우저 엔진 → Service Worker → 알림 표시
                          (PWA 설치 + 브라우저 실행 중이면 수신 ✅)
```

## 구성 요소 역할 구분

| 구성 요소 | 역할 |
|---|---|
| Supabase Cron | 매 1분마다 Edge Function 트리거 |
| Supabase Edge Function | 알림 발송 로직 전체 실행 (Deno/TS) |
| Supabase DB | 구독자 목록·FCM 토큰 저장소 |
| Supabase Secrets | Firebase 서비스 계정 키 보관 |
| Firebase Admin SDK | Edge Function 내 라이브러리 — FCM 서버 호출 담당 |
| Vercel API | 학식·날씨 데이터 제공 |
| FCM 서버 | 각 기기로 푸시 알림 배달 |
