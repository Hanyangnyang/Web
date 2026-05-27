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
          await PushNotifications.register();
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
      const token = await getToken(msg, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      });
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
