import { PushNotifications } from '@capacitor/push-notifications';
import { App } from '@capacitor/app';
import { isNativeApp } from './platform';

const PROMPT_LIMIT_KEY = 'hide_event_alarm_until';
const COOLDOWN_DAYS = 7;

/**
 * 7일 동안 팝업을 보이지 않도록 설정합니다.
 */
export const setAlarmPromptCooldown = () => {
  const cooldownMs = COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
  const hideUntil = Date.now() + cooldownMs;
  localStorage.setItem(PROMPT_LIMIT_KEY, String(hideUntil));
};

/**
 * 현재 권한 및 7일 쿨다운 상태를 검사하여 팝업을 보여줄지 여부를 결정합니다.
 */
export const checkShouldShowAlarmPrompt = async () => {
  try {
    // 1. 7일 유예 기간 확인
    const hideUntil = localStorage.getItem(PROMPT_LIMIT_KEY);
    if (hideUntil) {
      const isCoolingDown = Date.now() < Number(hideUntil);
      if (isCoolingDown) {
        return false;
      }
    }

    // 2. 실제 디바이스/웹 권한 상태 확인
    if (isNativeApp()) {
      try {
        const permStatus = await PushNotifications.checkPermissions();
        // receive가 'prompt'일 때만 물어봅니다. ('granted'나 'denied'면 안 물어봄)
        return permStatus.receive === 'prompt';
      } catch (err) {
        console.error('Capacitor checkPermissions error:', err);
        return false;
      }
    } else {
      // Web
      if (typeof window === 'undefined' || !('Notification' in window)) {
        return false; // 알림 미지원 브라우저
      }
      
      const permission = Notification.permission;
      // permission이 'default'일 때만 물어봅니다. ('granted'나 'denied'면 안 물어봄)
      return permission === 'default';
    }
  } catch (err) {
    console.error('Error evaluating shouldShowAlarmPrompt:', err);
    return false;
  }
};

/**
 * PWA standalone 모드 실행 여부를 감지합니다.
 */
export const isPwaStandalone = () => {
  if (typeof window === 'undefined') return false;
  const isIosPwa = window.navigator.standalone === true;
  const isAndroidPwa = window.matchMedia('(display-mode: standalone)').matches;
  return isIosPwa || isAndroidPwa;
};

/**
 * 네이티브 앱의 설정 화면을 직접 엽니다.
 */
export const openSystemSettings = async () => {
  if (isNativeApp()) {
    try {
      await App.openAppSettings();
    } catch (err) {
      console.error('Failed to open app settings:', err);
    }
  }
};

