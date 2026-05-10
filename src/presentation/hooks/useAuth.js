// 훅(ViewModel): 인증 상태 관리 - 로그인·로그아웃·자동 재로그인
import { useState, useEffect, useCallback } from 'react';
import { loginUseCase, reloginUseCase, authRepository } from '../../di.js';
import { useBoot } from '../context/BootContext';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const { markReady } = useBoot();

  useEffect(() => {
    authRepository.getStoredSession().then(session => {
      if (session) setUser(session);
      setLoading(false);
      markReady('auth');
    });
  }, [markReady]);

  const login = useCallback(async ({ loginId, password }) => {
    const newUser = await loginUseCase.execute({ loginId, password });
    setUser(newUser);
    return newUser;
  }, []);

  const relogin = useCallback(async () => {
    const encryptedCredentials = await authRepository.getStoredEncryptedCredentials();
    if (!encryptedCredentials) throw new Error('저장된 자격증명 없음');
    const updatedUser = await reloginUseCase.execute({ encryptedCredentials });
    setUser(prev => ({ ...prev, token: updatedUser.token }));
    return updatedUser;
  }, []);

  const logout = useCallback(async () => {
    await authRepository.logout();
    setUser(null);
  }, []);

  const updateUser = useCallback((updates) => {
    setUser(prev => prev ? { ...prev, ...updates } : prev);
  }, []);

  return { user, loading, login, relogin, logout, updateUser };
}
