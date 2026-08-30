import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, isSupported, type Messaging } from 'firebase/messaging';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { FCM } from '@capacitor-community/fcm';
import { initSentry } from './sentry.js';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

let messaging: Messaging | null = null;

// 웹 전용 FCM 메시징 인스턴스를 지연 생성
export const initMessaging = async (): Promise<Messaging | null> => {
  if (Capacitor.isNativePlatform()) return null;
  if (messaging) return messaging;
  try {
    const supported = await isSupported(); // 브라우저가 Push API를 지원하는지 확인
    if (supported) {
      messaging = getMessaging(app); // 한 번 만든 인스턴스는 모듈 변수 messaging에 캐싱
      return messaging;
    }
  } catch (err) {
    console.error('Firebase messaging not supported', err);
  }
  return null;
};

let cachedNativeToken: string | null = null;

// 네이티브 알림 권한 요청 + FCM 토큰 발급 (Capacitor PushNotifications + @capacitor-community/fcm)
const requestNativeFcmToken = async (): Promise<string | null> => {
  let permStatus = await PushNotifications.checkPermissions(); // OS 권한 확인

  if (permStatus.receive === 'prompt') {
    permStatus = await PushNotifications.requestPermissions(); // OS 권한 팝업
  }

  if (permStatus.receive !== 'granted') { // OS 권한 거부
    console.warn('Native notification permission denied');
    return null;
  }

  if (cachedNativeToken) return cachedNativeToken;

  try {
    await new Promise<void>((resolve, reject) => {
      PushNotifications.addListener('registration', () => resolve());
      PushNotifications.addListener('registrationError', (err) => reject(new Error(err.error)));
      PushNotifications.register();
    });
    const { token } = await FCM.getToken(); // FCM 토큰 발급
    cachedNativeToken = token; // FCM 토큰 캐싱
    return token;
  } catch (e) {
    console.error('FCM Push register failed:', e);
    initSentry().then(Sentry => {
      Sentry.captureException(e, { tags: { source: 'fcm-native-register' } });
    });
    return null;
  }
};

// 웹/PWA 알림 권한 요청 + FCM 토큰 발급 (브라우저 Notification API + firebase/messaging)
const requestWebFcmToken = async (): Promise<string | null> => {
  const msg = await initMessaging();
  if (!msg) {
    console.warn('Messaging not supported on this browser');
    return null;
  }

  const permission = await Notification.requestPermission(); // 브라우저 권한 팝업
  if (permission !== 'granted') { // 브라우저 권한 거부
    console.warn('Notification permission denied');
    return null;
  }

  return getToken(msg, {
    vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
  });
};

// 웹/네이티브 각각 알림 권한 요청 및 토큰 발급
export const requestNotificationPermission = async (): Promise<string | null> => {
  try {
    return Capacitor.isNativePlatform()
      ? await requestNativeFcmToken()
      : await requestWebFcmToken();
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    initSentry().then(Sentry => {
      Sentry.captureException(error, { tags: { source: 'fcm-request-permission' } });
    });
    return null;
  }
};

// 알림 권한 확인 (권한 요청은 하지 않음)
export const checkNotificationPermission = async (): Promise<boolean> => {
  try {
    if (Capacitor.isNativePlatform()) {
      let permStatus = await PushNotifications.checkPermissions();
      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }
      return permStatus.receive === 'granted';
    }

    const permission = Notification.permission;
    if (permission === 'default') {
      const result = await Notification.requestPermission();
      return result === 'granted';
    }
    return permission === 'granted';
  } catch (err) {
    console.error('Error checking notification permission:', err);
    initSentry().then(Sentry => {
      Sentry.captureException(err, { tags: { source: 'fcm-check-permission' } });
    });
    return false;
  }
};
