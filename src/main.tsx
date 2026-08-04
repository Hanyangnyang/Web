import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import * as Sentry from '@sentry/capacitor'
import * as SentryReact from '@sentry/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient.js'

// Sentry 초기화
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

// PostHog 초기화
if (import.meta.env.VITE_POSTHOG_KEY) {
  posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
    api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com',
  })
}

// Kakao SDK는 더 이상 여기서 초기화하지 않음 — ShareSheet가 마운트될 때 lib/kakao.js가 지연 로드함

// Service Worker 업데이트 감지 후 새로고침
if ('serviceWorker' in navigator) {
  const hadController = !!navigator.serviceWorker.controller
  let refreshing = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController) return
    if (!refreshing) {
      refreshing = true
      window.location.reload()
    }
  })
}

// React 렌더링
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PostHogProvider client={posthog}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </PostHogProvider>
  </StrictMode>,
)
