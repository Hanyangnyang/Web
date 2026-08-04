import { Network } from '@capacitor/network';
import { isNativeApp } from '../../lib/platform.js';

// 현재 온라인 상태를 반환하는 함수
export async function getInitialOnlineStatus(): Promise<boolean> {
  if (isNativeApp()) {
    try {
      const status = await Network.getStatus();
      return status.connected;
    } catch (e) {
      console.warn('[NetworkStatus] getStatus 실패, navigator.onLine으로 폴백:', e);
      return navigator.onLine;
    }
  }
  return navigator.onLine;
}

// 온라인<->오프라인 상태 변경을 구독하는 함수
export function subscribeToNetworkStatus(listener: (isOnline: boolean) => void): () => void {
  if (isNativeApp()) {
    let handle: { remove: () => void } | null = null;
    let cancelled = false;
    Network.addListener('networkStatusChange', (status) => listener(status.connected))
      .then((h) => {
        if (cancelled) h.remove();
        else handle = h;
      })
      .catch((e) => console.warn('[NetworkStatus] addListener 실패:', e));
    return () => {
      cancelled = true;
      handle?.remove();
    };
  }

  const onOnline = () => listener(true);
  const onOffline = () => listener(false);
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);
  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
}
