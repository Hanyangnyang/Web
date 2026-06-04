import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { FCM } from '@capacitor-community/fcm';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

let messaging = null;

export const initMessaging = async () => {
  if (Capacitor.isNativePlatform()) return null;
  if (messaging) return messaging;
  try {
    const supported = await isSupported();
    if (supported) {
      messaging = getMessaging(app);
      return messaging;
    }
  } catch (err) {
    console.error('Firebase messaging not supported', err);
  }
  return null;
};

let cachedNativeToken = null;

export const requestNotificationPermission = async () => {
  try {
    if (Capacitor.isNativePlatform()) {
      let permStatus = await PushNotifications.checkPermissions();
      
      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }
      
      if (permStatus.receive === 'granted') {
        if (cachedNativeToken) return cachedNativeToken;

        try {
          await new Promise((resolve, reject) => {
            PushNotifications.addListener('registration', () => resolve());
            PushNotifications.addListener('registrationError', (err) => reject(new Error(err.error)));
            PushNotifications.register();
          });
          const { token } = await FCM.getToken();
          cachedNativeToken = token;
          return token;
        } catch (e) {
          console.error('FCM Push register failed:', e);
          return null;
        }
      } else {
        console.warn('Native notification permission denied');
        return null;
      }
    }

    const msg = await initMessaging();
    if (!msg) {
      console.warn('Messaging not supported on this browser');
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      let token;
      try {
        // iOS PWA 및 Vite-PWA(sw.js)의 루트 스코프와의 충돌을 차단하기 위해 Firebase 서비스 워커 전용 스코프로 수동 등록합니다.
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
          scope: '/firebase-cloud-messaging-push-scope'
        });
        token = await getToken(msg, {
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
          serviceWorkerRegistration: registration,
        });
      } catch (err) {
        console.warn('Failed to register firebase-messaging-sw.js on custom scope, falling back to default:', err);
        token = await getToken(msg, {
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
        });
      }
      return token;
    } else {
      console.warn('Notification permission denied');
      return null;
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return null;
  }
};

export const checkNotificationPermission = async () => {
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
    return false;
  }
};
