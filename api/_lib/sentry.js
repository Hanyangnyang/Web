// 공용 모듈: Vercel 서버리스 함수(api/*.js)의 실행 중 에러를 Sentry로 전송한다.
// 프론트(src/lib/sentry.ts)와 같은 DSN(같은 Sentry 프로젝트)을 쓰되, Node 런타임이라 SDK가 다름.
// 서버리스는 응답을 보낸 직후 프로세스가 그대로 얼려지거나 종료될 수 있어서, 캡처 후 flush로
// 실제 전송이 끝날 때까지 기다려야 한다 — await 없이 호출하면 이벤트가 유실될 수 있다.
import * as Sentry from '@sentry/node';

const DSN = 'https://bb060324beea4e9a9a8ebcb92d08c0f6@o4511642871267328.ingest.us.sentry.io/4511642938245120';

let initialized = false;

function ensureInit() {
  if (initialized) return;
  Sentry.init({
    dsn: DSN,
    environment: process.env.VERCEL_ENV || 'development',
  });
  initialized = true;
}

export async function captureApiError(error, tags = {}) {
  ensureInit();
  Sentry.captureException(error, { tags });
  await Sentry.flush(2000);
}
