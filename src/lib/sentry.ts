// Sentry는 초기 렌더를 막지 않도록 지연 로드한다.
// main.tsx(idle 시점)와 useLocation.ts(에러 발생 시점)가 이 캐싱된 Promise 하나를
// 공유하므로, 둘 중 어느 쪽이 먼저 호출하든 실제 로딩+init은 한 번만 일어난다.
let initPromise: ReturnType<typeof load> | null = null;

async function load() {
  const [Sentry, SentryReact] = await Promise.all([
    import('@sentry/capacitor'),
    import('@sentry/react'),
  ]);

  Sentry.init(
    {
      dsn: "https://bb060324beea4e9a9a8ebcb92d08c0f6@o4511642871267328.ingest.us.sentry.io/4511642938245120",
      enabled: import.meta.env.PROD,
      environment: import.meta.env.MODE,
      integrations: [
        Sentry.browserTracingIntegration(),
      ],
      tracesSampleRate: 1.0,
      tracePropagationTargets: ["localhost", "https://www.hanyang.life"],
      enableLogs: true,
    },
    SentryReact.init,
  );

  return Sentry;
}

export function initSentry() {
  if (!initPromise) {
    initPromise = load();
  }
  return initPromise;
}
