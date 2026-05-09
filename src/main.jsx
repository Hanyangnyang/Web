import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const kakaoKey = import.meta.env.VITE_KAKAO_JS_KEY;
if (kakaoKey && window.Kakao && !window.Kakao.isInitialized()) {
  window.Kakao.init(kakaoKey);
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
