// 훅: 캠퍼스맵 점메추/저메추/어디가지 랜덤 추천
// 식당·교내시설·오픈스페이스·흡연장·전체(또는 미선택) 칩에서는 항상 '식당' 카테고리에서 뽑는다("밥"이라는 맥락이 자연스러움).
// 카페/주점/여가/생활 칩이 켜져 있을 땐 "점메추"라는 말이 안 어울려서, 그 칩의 카테고리에서 뽑고 라벨도 "어디가지"로 바꾼다.
import { useCallback, useState } from 'react';
import { visibleStores, type CategoryFilter, type PartnerStore, type StoreCategory } from '../../../domain/entities/PartnerStore.js';

// 주사위가 잠깐 굴러가는 연출 후 결과 공개
const ROLL_DELAY_MS = 500;

// 이 카테고리들이 활성 칩일 땐 "점메추" 대신 "어디가지"로, 그 카테고리 안에서 뽑는다
const NON_FOOD_CATEGORIES = new Set<StoreCategory>(['cafe', 'pub', 'play', 'life']);

interface Params {
  stores: PartnerStore[];
  excludeId: string | null; // 직전 선택은 제외해 연속 중복 방지
  // useCampusMapLayers().storeCategory 그대로 — 매장 카테고리 칩이 아니면(교내시설 등) null, '전체'면 'all'
  activeCategory: CategoryFilter | null;
  onPick: (store: PartnerStore) => void;
  posthog?: { capture: (event: string, props?: Record<string, unknown>) => void };
}

export function usePartnerRandomPick({ stores, excludeId, activeCategory, onPick, posthog }: Params) {
  const [rolling, setRolling] = useState(false);

  const isNonFoodCategoryActive = !!activeCategory && NON_FOOD_CATEGORIES.has(activeCategory as StoreCategory);
  const pickCategory: CategoryFilter = isNonFoodCategoryActive ? (activeCategory as StoreCategory) : 'food';

  const rollRandom = useCallback(() => {
    if (rolling) return;
    const pool = visibleStores(stores, pickCategory).filter((s) => s.id !== excludeId);
    if (pool.length === 0) return;
    setRolling(true);
    posthog?.capture('partner_map_random_clicked', { category: pickCategory });
    setTimeout(() => {
      const store = pool[Math.floor(Math.random() * pool.length)];
      onPick(store);
      setRolling(false);
    }, ROLL_DELAY_MS);
  }, [rolling, stores, excludeId, pickCategory, onPick, posthog]);

  // 카페/주점/여가/생활 칩에서는 시간대와 무관하게 "어디가지".
  // 그 외(식당/교내시설/오픈스페이스/흡연장/전체)는 기존처럼 시간대에 따라 말을 건다.
  const hour = new Date().getHours();
  const diceLabel = isNonFoodCategoryActive
    ? '어디가지'
    : hour >= 11 && hour < 16 ? '점메추' : hour >= 16 && hour < 22 ? '저메추' : '뭐먹지';

  return { rolling, rollRandom, diceLabel };
}
