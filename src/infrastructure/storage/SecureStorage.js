import { SecureStoragePlugin } from 'capacitor-secure-storage-plugin';
import { isNativeApp } from '../../lib/platform.js';

export const hybridSecureStorage = {
  getItem: async (key) => {
    if (isNativeApp()) {
      try {
        const { value } = await SecureStoragePlugin.get({ key });
        return value;
      } catch (e) {
        console.warn('SecureStorage getItem failed, falling back to localStorage:', e);
        // 저장 공간 부재 등의 에러가 발생해도, 로컬 백업용으로 localStorage를 안전 폴백으로 조회합니다.
        try {
          return localStorage.getItem(key);
        } catch (localErr) {
          return null;
        }
      }
    }
    return localStorage.getItem(key);
  },
  setItem: async (key, value) => {
    if (isNativeApp()) {
      try {
        await SecureStoragePlugin.set({ key, value });
        // 심층 방어: 만약 플러그인이 정상 작동하더라도 백업 조회를 위해 localStorage에도 동기화해 둡니다.
        localStorage.setItem(key, value);
      } catch (e) {
        console.error('SecureStorage setItem failed, writing to localStorage:', e);
        try {
          localStorage.setItem(key, value);
        } catch (localErr) {
          console.error('localStorage setItem fallback failed:', localErr);
        }
      }
    } else {
      localStorage.setItem(key, value);
    }
  },
  removeItem: async (key) => {
    if (isNativeApp()) {
      try {
        await SecureStoragePlugin.remove({ key });
        localStorage.removeItem(key);
      } catch (e) {
        console.error('SecureStorage removeItem failed, removing from localStorage:', e);
        try {
          localStorage.removeItem(key);
        } catch (localErr) {
          console.error('localStorage removeItem fallback failed:', localErr);
        }
      }
    } else {
      localStorage.removeItem(key);
    }
  }
};
