// 훅: 캠퍼스맵 화면 하단에 잠깐 떴다 사라지는 안내 토스트
import { useEffect, useState } from 'react';

const TOAST_DURATION_MS = 2500;

export function useCampusMapToast() {
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  return { toast, showToast: setToast };
}
