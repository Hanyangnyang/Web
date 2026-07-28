// 유스케이스: 특정 날짜의 식당별 식단 정보 조회
import type { Cafe } from '../entities/Cafe.js';
import type { MenuRepository } from '../../data/repositories/MenuRepository.js';

export interface GetMenuUseCase {
  execute: (dateStr: string) => Promise<Cafe[]>;
}

export const createGetMenuUseCase = (
  { menuRepository }: { menuRepository: MenuRepository }
): GetMenuUseCase => ({
  execute: (dateStr: string) => menuRepository.getMenus(dateStr),
});
