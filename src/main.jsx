import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const kakaoKey = import.meta.env.VITE_KAKAO_JS_KEY;
if (!kakaoKey) {
  console.warn('[Kakao] VITE_KAKAO_JS_KEY 없음 — 카카오톡 공유 비활성화');
} else if (!window.Kakao) {
  console.warn('[Kakao] SDK 로드 실패 — index.html의 script 태그 확인 필요');
} else if (!window.Kakao.isInitialized()) {
  try {
    window.Kakao.init(kakaoKey);
    console.log('[Kakao] SDK 초기화 완료');
  } catch (e) {
    console.error('[Kakao] init 실패:', e);
  }
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
    <App />
  </StrictMode>,
)
