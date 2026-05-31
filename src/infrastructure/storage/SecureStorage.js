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
      await SecureStoragePlugin.set({ key, value });
    } else {
      localStorage.setItem(key, value);
    }
  },
  removeItem: async (key) => {
    if (isNativeApp()) {
      try {
        await SecureStoragePlugin.remove({ key });
      } catch (e) {
        console.warn('SecureStorage removeItem failed:', e);
      }
      // 이전 버전에서 localStorage에 저장된 잔여 데이터도 함께 제거
      try { localStorage.removeItem(key); } catch (_) {}
    } else {
      localStorage.removeItem(key);
    }
  }
};
