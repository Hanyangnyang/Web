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

// PostHog 초기화 — Sentry(enabled: import.meta.env.PROD)와 달리 dev에서도 그대로 이벤트를 보냄(로컬에서
// 실험 이벤트를 한 번 발생시켜야 PostHog 지표 선택창에 뜨기 때문). 대신 모든 이벤트에 environment
// 속성을 붙여서, 대시보드에서 개발 중 발생한 이벤트를 실사용자 지표 계산에서 걸러낼 수 있게 함
if (import.meta.env.VITE_POSTHOG_KEY) {
  posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
    api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com',
  })
  posthog.register({ environment: import.meta.env.MODE })
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

// 배포 직후 옛날 index.html을 들고 있던 사용자가 이미 사라진 해시 붙은 청크 파일을
// 불러오려다 실패하는 경우(Vite가 던지는 전용 이벤트) — 강제 새로고침으로 최신 index.html을
// 다시 받아오게 함. sessionStorage 가드로 한 세션에 한 번만 시도해 무한 새로고침 루프를 막는다
window.addEventListener('vite:preloadError', () => {
  if (sessionStorage.getItem('vite_preload_error_reloaded')) return
  sessionStorage.setItem('vite_preload_error_reloaded', 'true')
  window.location.reload()
})

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
