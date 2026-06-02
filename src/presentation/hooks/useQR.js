// 훅(ViewModel): QR 코드 조회·자동 갱신·토큰 만료 시 재로그인 처리
import { useState, useEffect, useCallback, useRef } from 'react';
import { getQRCodeUseCase } from '../../di.js';

export function useQR({ user, reloginFn, onNameDiscovered, onLogout }) {
  const userRef = useRef(user);
  useEffect(() => { userRef.current = user; }, [user]);

  const [qrData, setQrData]     = useState(null);
  const [status, setStatus]     = useState('loading');
  const [refreshing, setRefreshing] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);

  const refreshRef = useRef(null);

  const refresh = useCallback(async (explicitToken) => {
    const token = explicitToken ?? userRef.current?.token;
    if (!token) return;

    setRefreshing(true);
    if (!explicitToken) setTimeLeft(30);

    try {
      const qrCode = await getQRCodeUseCase.execute(token);
      setQrData(qrCode.value);
      if (qrCode.patronName) onNameDiscovered?.(qrCode.patronName);
      setStatus('ready');
    } catch (err) {
      const isAuthErr = err.statusCode === 401 || err.statusCode === 403 || err.code === 'NO_QR_DATA';
      if (isAuthErr && !explicitToken) {
        try {
          const updatedUser = await reloginFn?.();
          if (updatedUser?.token) { await refreshRef.current?.(updatedUser.token); return; }
        } catch { /* 재로그인 실패 → 로그아웃 */ }
        onLogout?.();
      } else {
        setStatus('error');
      }
    } finally {
      setRefreshing(false);
    }
  }, [reloginFn, onNameDiscovered, onLogout]);

  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  // 최초 로드
  useEffect(() => {
    if (user?.token) {
      setTimeout(() => {
        refresh();
      }, 0);
    }
  }, [user?.token]); // eslint-disable-line react-hooks/exhaustive-deps

  // 30초 카운트다운 후 자동 갱신
  useEffect(() => {
    if (status !== 'ready' || timeLeft <= 0 || refreshing) {
      if (timeLeft === 0 && !refreshing) {
        setTimeout(() => {
          refresh();
        }, 0);
      }
      return;
    }
    const timer = setInterval(() => setTimeLeft(p => p - 1), 1000);
    return () => clearInterval(timer);
  }, [status, timeLeft, refreshing, refresh]);

  return { qrData, status, refreshing, timeLeft, refresh: () => refresh() };
}
