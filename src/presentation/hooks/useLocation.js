// 앱 전체의 유일한 측위 경로.
// 모듈 레벨 캐시를 두어 셔틀 탭과 일반버스 화면이 좌표를 공유하고,
// 동시에 요청해도 실제 측위는 한 번만 일어난다.
import { useState, useEffect } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import * as Sentry from '@sentry/capacitor';

// 캐시 신선도 허용치: 도보 이동으로 최근접 정류장이 바뀌기 어려운 시간
const MAX_AGE_MS = 2 * 60 * 1000;

let cache = null;    // { latitude, longitude, timestamp }
let inflight = null; // 진행 중인 측위 Promise — 중복 요청을 하나로 합침

const isFresh = (c) => c && Date.now() - c.timestamp < MAX_AGE_MS;

// 네이티브(Android/iOS) 타임아웃 에러 코드와 웹(navigator.geolocation) 타임아웃 코드.
// 권한 거부(OS-PLUG-GLOC-0003 등)는 재시도해도 결과가 같으므로 재시도 대상에서 제외한다.
const NATIVE_TIMEOUT_CODE = 'OS-PLUG-GLOC-0010';
const WEB_TIMEOUT_CODE = 3; // GeolocationPositionError.TIMEOUT
const MAX_ATTEMPTS = 3;

const isTimeoutError = (error) =>
  error?.code === NATIVE_TIMEOUT_CODE || error?.code === WEB_TIMEOUT_CODE;

function getCurrentPosition() {
  return Geolocation.getCurrentPosition({
    // 정류장 간 거리가 수백m~1km 이상이라 COARSE 정확도로 충분하다.
    // Android 12+에서 enableHighAccuracy:true는 FINE 권한을 요구해, "대략적 위치만" 허용한
    // 사용자에게 프리페치 게이트(coarseLocation granted 통과)와 무관하게 팝업이 다시 뜨는 문제가 있었다.
    enableHighAccuracy: false,
    timeout: 5000,
    maximumAge: MAX_AGE_MS,
  });
}

// 콜드부팅 직후 GPS 콜드픽스로 타임아웃될 수 있어 타임아웃에 한해 최대 3회까지 시도한다.
async function measureWithRetry(attempt = 1) {
  try {
    return await getCurrentPosition();
  } catch (error) {
    if (attempt < MAX_ATTEMPTS && isTimeoutError(error)) {
      return measureWithRetry(attempt + 1);
    }
    throw error;
  }
}

function measure() {
  if (inflight) return inflight;
  // 프리페치·온디맨드 양쪽이 이 Promise를 공유하므로, 실패 리포팅은 호출부가 아닌
  // 여기 한 곳에서만 해야 같은 실패가 두 건으로 중복 집계되지 않는다.
  inflight = measureWithRetry()
    .then((pos) => {
      cache = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        timestamp: Date.now(),
      };
      return cache;
    })
    .catch((error) => {
      Sentry.captureMessage('Shuttle geolocation failed', { level: 'warning', extra: { error } });
      throw error; // 호출부가 각자 폴백을 처리할 수 있게 그대로 전파
    })
    .finally(() => { inflight = null; });
  return inflight;
}

// 앱 부팅 시 호출: 권한이 이미 granted인 사용자에게만 백그라운드 측위를 시작한다.
// 권한이 없으면 아무것도 하지 않는다 — 앱 시작 직후 맥락 없는 권한 팝업이 뜨면
// 승인율이 떨어지므로, 권한 요청 자체는 위치가 실제로 필요한 화면에서만 일어나야 한다.
export async function prefetchLocation() {
  try {
    const status = await Geolocation.checkPermissions();
    if (status.location === 'granted' || status.coarseLocation === 'granted') {
      measure().catch((error) => {
        console.warn('Prefetch geolocation failed.', error);
      });
    }
  } catch {
    // 권한 조회를 지원하지 않는 환경(일부 브라우저)에서는 프리페치를 건너뛴다
  }
}

export function useLocation(active) {
  const [measured, setMeasured] = useState(null);
  const [isLocating, setIsLocating] = useState(false);

  // 캐시가 신선하면 상태 갱신(다음 렌더)을 기다리지 않고 이번 렌더에서 바로 반환.
  // 탭 진입 순간 프리페치된 좌표가 한 프레임 지연도 없이 쓰이게 하기 위함.
  const coords = measured ?? (active && isFresh(cache) ? cache : null);

  useEffect(() => {
    if (!active) return;
    if (isFresh(cache)) {
      setMeasured(cache); // 상태로 고정 — 이후 캐시가 만료돼도 이번 화면의 좌표는 유지
      return;
    }
    let cancelled = false;
    setIsLocating(true);
    measure()
      .then((c) => { if (!cancelled) setMeasured(c); })
      .catch((error) => {
        // 권한 거부·측위 실패 시 좌표 없이 동작 (호출부가 폴백 처리)
        console.warn('Geolocation failed or permission denied.', error);
      })
      .finally(() => { if (!cancelled) setIsLocating(false); });
    return () => { cancelled = true; };
  }, [active]);

  return { coords, isLocating };
}
