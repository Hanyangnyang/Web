import { SecureStoragePlugin } from 'capacitor-secure-storage-plugin';
import { isNativeApp } from '../../lib/platform.js';

export const hybridSecureStorage = {
  getItem: async (key) => {
    if (isNativeApp()) {
      try {
        const { value } = await SecureStoragePlugin.get({ key });
        return value;
      } catch (e) {
        return null; // 저장된 키가 없는 경우 등
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
      await SecureStoragePlugin.remove({ key });
    } else {
      localStorage.removeItem(key);
    }
  }
};
