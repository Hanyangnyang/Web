// 훅: 모달/시트가 열려있는 동안 안드로이드 하드웨어 뒤로가기를 가로채서 닫기 동작으로 연결
import { useEffect } from 'react';
import { pushBackHandler, popBackHandler } from '../../lib/androidBackHandler.js';

export function useBackHandler(onBack: () => void) {
  useEffect(() => {
    pushBackHandler(onBack);
    return () => { popBackHandler(); };
  }, [onBack]);
}
