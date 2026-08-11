// 훅: 캠퍼스맵 점메추/저메추 랜덤 추천 — 항상 '식당' 카테고리에서만 뽑는다
import { useCallback, useState } from 'react';
import { visibleStores, type PartnerStore } from '../../../domain/entities/PartnerStore.js';

// 주사위가 잠깐 굴러가는 연출 후 결과 공개
const ROLL_DELAY_MS = 500;

interface Params {
  stores: PartnerStore[];
  excludeId: string | null; // 직전 선택은 제외해 연속 중복 방지
  onPick: (store: PartnerStore) => void;
  posthog?: { capture: (event: string, props?: Record<string, unknown>) => void };
}

export function usePartnerRandomPick({ stores, excludeId, onPick, posthog }: Params) {
  const [rolling, setRolling] = useState(false);

  const rollRandom = useCallback(() => {
    if (rolling) return;
    const pool = visibleStores(stores, 'food').filter((s) => s.id !== excludeId);
    if (pool.length === 0) return;
    setRolling(true);
    posthog?.capture('partner_map_random_clicked');
    setTimeout(() => {
      const store = pool[Math.floor(Math.random() * pool.length)];
      onPick(store);
      setRolling(false);
    }, ROLL_DELAY_MS);
  }, [rolling, stores, excludeId, onPick, posthog]);

  // 시간대에 따라 버튼이 지금의 고민에 말을 건다: 점심(11~15시) 점메추, 저녁(16~21시) 저메추
  const hour = new Date().getHours();
  const diceLabel = hour >= 11 && hour < 16 ? '점메추' : hour >= 16 && hour < 22 ? '저메추' : '뭐먹지';

  return { rolling, rollRandom, diceLabel };
}
