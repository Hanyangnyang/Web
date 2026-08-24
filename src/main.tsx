import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient.js'
import { initSentry } from './lib/sentry.js'
import { ErrorBoundary } from './presentation/components/common/ErrorBoundary.jsx'
import { AppCrashScreen } from './presentation/components/common/AppCrashScreen.jsx'

// Sentry는 초기 렌더를 막지 않도록, 브라우저가 한가할 때(idle) 지연 로드
const scheduleIdle: (cb: () => void) => void =
  typeof window.requestIdleCallback === 'function'
    ? window.requestIdleCallback.bind(window)
    : (cb) => setTimeout(cb, 200)
scheduleIdle(() => { initSentry() })

// PostHog 초기화
if (import.meta.env.VITE_POSTHOG_KEY) {
  posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
    api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com',
  })
}

// Kakao SDK는 더 이상 여기서 초기화하지 않음 — ShareSheet가 마운트될 때 lib/kakaoShare.js가 지연 로드함

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
// 최상단 ErrorBoundary는 카드 단위 경계(PortalView)를 빠져나온 예외까지 받아내는 최후의 안전망이다.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PostHogProvider client={posthog}>
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary name="app-root" fallback={<AppCrashScreen />}>
          <App />
        </ErrorBoundary>
      </QueryClientProvider>
    </PostHogProvider>
  </StrictMode>,
)
