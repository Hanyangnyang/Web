import { SecureStoragePlugin } from 'capacitor-secure-storage-plugin';
import { isNativeApp } from '../../lib/platform.js';
import type { SupportedStorage } from '@supabase/supabase-js';

// Supabase auth의 storage 옵션이 요구하는 형태(SupportedStorage)를 그대로 구현 —
// 타입 단에서 supabase.js에 그대로 주입 가능함이 보장된다
export const hybridSecureStorage: SupportedStorage = {
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
