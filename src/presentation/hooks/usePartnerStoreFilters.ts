// 훅: 캠퍼스맵 카테고리·단과대 필터 상태
import { useCallback, useState } from 'react';
import type { CategoryFilter } from '../../domain/entities/PartnerStore.js';

const COLLEGE_FILTER_STORAGE_KEY = 'partnerCollegeFilter';

export function usePartnerStoreFilters() {
  const [category, setCategory] = useState<CategoryFilter>('all');
  // 단과대 필터 — 예전 리스트 뷰의 기능 승계, 같은 localStorage 키로 이어받는다
  const [college, setCollegeState] = useState(
    () => localStorage.getItem(COLLEGE_FILTER_STORAGE_KEY) || 'all'
  );

  const setCollege = useCallback((next: string) => {
    setCollegeState(next);
    localStorage.setItem(COLLEGE_FILTER_STORAGE_KEY, next);
  }, []);

  return { category, setCategory, college, setCollege };
}
