# 백엔드 이전 중 보류된 작업 메모
새 백엔드로 이전하는 과정에서 백엔드 쪽과 합을 맞춰야 해서 지금 당장은 못 하고 미뤄둔 작업들을 탭별로 기록한다. 백엔드 쪽 준비가 끝나면 여기 적힌 항목부터 확인할 것.

## 셔틀 탭
- 셔틀/지하철 시간표 로직 달라진거 없는지 확인하기

## 소식 탭
- **날씨 알림 발송도 구 백엔드 응답 형태를 바라보고 있음**: `supabase/functions/menu-alerts/index.ts`의 날씨 알림(WEATHER_ALERT) 부분이 여전히 구 Vercel BFF `/api/portal?type=weather`를 호출하고, `weatherData.hasPrecipitation`/`airQuality.pm10.label`/`weatherCode`/`temp`/`message` 같은 구 응답 필드를 참조함. 근데 실제 날씨 화면([WeatherApiDataSource.ts](../src/data/datasources/WeatherApiDataSource.ts))은 이미 새 백엔드 `/api/v1/weather`를 쓰고 있고 응답 모양도 완전히 다름(`current`/`hourly`, `weatherCondition`/`pm10Grade` 등). 학식 알림이랑 똑같은 패턴의 문제 — 화면은 새 데이터, 알림은 구 데이터.
  - **필요한 것**: `menu-alerts`의 날씨 알림 부분도 fetch 대상을 `/api/v1/weather`로 바꾸고, 조건 판단 로직(비/눈, 미세먼지, 자외선, 평일 브리핑)을 새 응답 필드에 맞게 다시 짜야 함.

## 학식 탭
- **알림 발송이 아직 구 크롤링 방식**: `supabase/functions/menu-alerts/index.ts`가 여전히 구 스크래퍼(`/api/menu`)를 호출해서 알림을 보내고 있음. 화면은 새 백엔드(`/api/v1/menu`) 데이터를 쓰는데 알림은 구 크롤링 데이터를 써서 서로 다른 데이터를 보여줄 수 있는 상태.
  - **필요한 것**: `menu-alerts` Edge Function의 fetch 대상과 응답 파싱 로직을 새 백엔드 응답 형태(`cafeteriaCode`/`mealType`/`menuItems` 등)에 맞게 다시 짜야 함. 나중에 고치기로 함.


## 기타 탭
- **인스타그램 프로필 사진 자동 갱신 크론(`api/cron/refresh-insta-profiles.js`) 배포 전 수동 설정 필요**:
  4개월마다 인스타그램에서 프로필 사진을 재수집해 바뀐 것만 `public/assets/insta-profiles/`에
  커밋하는 크론을 추가했는데(`vercel.json`의 `crons`), 아래 두 환경변수를 Vercel 프로젝트에
  직접 등록해야 실제로 동작함 — 등록 전까진 크론이 401만 반환하고 아무 일도 안 함(안전하지만
  무의미한 상태).
  - **필요한 것**:
    1. Vercel 프로젝트 설정 → Environment Variables에 `CRON_SECRET`(임의의 랜덤 문자열) 추가
    2. `Hanyangnyang/Web` 저장소 한정, `Contents: Read and write` 권한만 있는 GitHub
       fine-grained PAT를 발급해서 `GITHUB_TOKEN`으로 추가
    3. 배포 후 Vercel 대시보드 "Cron Jobs" 탭에 스케줄이 정상 등록됐는지 확인
    4. 4개월(다음 실행)까지 안 기다리고 검증하려면 대시보드에서 수동 "Run"으로 한 번
       트리거해서 로그·GitHub 커밋·재배포까지 이어지는지 확인

## Sentry 에러 Discord 알림
- **Sentry 이슈 알림 → Discord 웹훅 중계(`api/sentry-discord-webhook.js`) 배포 전 수동 설정
  필요**: Sentry엔 진짜 Discord 연동이 없어서(유료 Slack 연동 편법뿐) 직접 중계 엔드포인트를
  만듦. Sentry가 이슈 알림을 웹훅으로 쏘면, 서명(HMAC-SHA256) 검증 후 Discord가 원하는 형식으로
  바꿔서 재전송하는 구조. 아래 설정 전까진 (a) Sentry 쪽에 웹훅 URL이 등록 안 돼있어서 아무것도
  안 오고, (b) `SENTRY_WEBHOOK_SECRET`/`DISCORD_WEBHOOK_URL` 환경변수가 없으면 요청이 와도
  401/500으로 막힘 — 안전하지만 등록 전까진 무의미한 상태.
  - **필요한 것**:
    1. Sentry → Settings → Developer Settings → New Internal Integration 생성
       (이름 예: "Discord Webhook Relay")
    2. Webhook URL을 `https://www.hanyang.life/api/sentry-discord-webhook`로 설정, 최소
       "Issue & Event: Read" 권한 부여, 이슈(issue) 웹훅 구독 체크
    3. 저장하면 Sentry가 발급하는 **Client Secret**을 복사 → Vercel 프로젝트 설정 →
       Environment Variables에 `SENTRY_WEBHOOK_SECRET`으로 등록
    4. Discord 서버 채널 설정 → 연동 → 웹훅 만들기에서 발급한 URL을 Vercel Environment
       Variables에 `DISCORD_WEBHOOK_URL`로 등록 (절대 코드에 하드코딩하지 않음)
    5. Sentry 프로젝트의 Alert Rules에서 이 Internal Integration을 액션으로 추가해
       (필요하면 "새 이슈 발생 시" 규칙에) 실제로 알림이 오는 경로를 완성
    6. 배포 후 Sentry에서 테스트 이슈를 하나 발생시켜(또는 알림 규칙 테스트 버튼으로) Discord
       채널에 실제로 메시지가 오는지 확인


## QA 자동화 
- **백엔드 이전 후 엣지케이스·예외케이스 QA를 자동화하고 싶음**: 구/신 백엔드가 같은 요청에
  다른 응답을 줄 수 있는 지점들을 사람이 손으로 다 찾기는 힘드니, 아래 두 도구를 조합해서
  검증하는 걸 시도해볼 것.
  - **Schemathesis란**: OpenAPI/GraphQL 스펙을 읽어서, 그 스펙이 허용하는 값의 경계·이상값
    (빈 문자열, null, 범위 밖 숫자, 잘못된 타입 등)을 자동으로 대량 생성해 실제 API에 쏴보는
    property-based 테스트 도구. 서버 크래시, 스펙 위반 응답, 검증 누락을 자동으로 잡아냄.
    단, 순수 API(HTTP) 레벨 도구라 프론트엔드는 전혀 못 보고 백엔드 오류만 잡아줌.
  - **필요한 것** (Schemathesis + Playwright 조합):
    1. Spring Boot 백엔드에서 Springdoc/Swagger로 OpenAPI 스펙을 뽑아서 Schemathesis로
       새 백엔드(`api.hanyang.life`)에 엣지케이스 요청을 대량 실행 → "이런 요청에 이런 이상한
       응답이 나온다" 목록 확보
    2. 그중 흥미로운 응답(빈 배열, null 필드, 예상 밖 타입 등)을 골라서 Playwright의
       `page.route()`로 프론트에 그대로 주입
    3. 그 상태로 실제 화면을 스크린샷/육안으로 확인해서, 백엔드가 이상 응답을 줬을 때 프론트가
       깨지거나 크래시 나는 지점을 찾아냄
