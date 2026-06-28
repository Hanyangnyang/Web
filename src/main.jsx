import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import * as Sentry from '@sentry/capacitor'
import * as SentryReact from '@sentry/react'

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
)

if (import.meta.env.VITE_POSTHOG_KEY) {
  posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
    api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com',
  })
}

const kakaoKey = import.meta.env.VITE_KAKAO_JS_KEY;
if (!kakaoKey) {
  console.warn('[Kakao] VITE_KAKAO_JS_KEY 없음 — 카카오톡 공유 비활성화');
  window.__kakaoStatus = 'NO_KEY';
} else if (!window.Kakao) {
  console.warn('[Kakao] SDK 로드 실패 — index.html의 script 태그 확인 필요');
  window.__kakaoStatus = 'SDK_NOT_LOADED';
} else if (!window.Kakao.isInitialized()) {
  try {
    window.Kakao.init(kakaoKey);
    window.__kakaoStatus = 'OK';
    console.log('[Kakao] SDK 초기화 완료');
  } catch (e) {
    window.__kakaoStatus = 'INIT_ERROR';
    console.error('[Kakao] init 실패:', e);
  }
} else {
  window.__kakaoStatus = 'OK';
}

if ('serviceWorker' in navigator) {
  let refreshing = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true
      window.location.reload()
    }
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PostHogProvider client={posthog}>
      <App />
    </PostHogProvider>
  </StrictMode>,
)
