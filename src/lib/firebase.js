import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

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

export const requestNotificationPermission = async () => {
  try {
    if (Capacitor.isNativePlatform()) {
      let permStatus = await PushNotifications.checkPermissions();
      
      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }
      
      if (permStatus.receive === 'granted') {
        await PushNotifications.register();
        
        return new Promise((resolve) => {
          const regListener = PushNotifications.addListener('registration', (token) => {
            regListener.remove();
            resolve(token.value);
          });
          const errListener = PushNotifications.addListener('registrationError', (err) => {
            console.error('Push registration error: ', err);
            errListener.remove();
            resolve(null);
          });
          // Timeout if registration takes too long
          setTimeout(() => {
            resolve(null);
          }, 5000);
        });
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

