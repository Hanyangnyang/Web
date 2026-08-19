// 유스케이스: 특정 날짜의 식당별 학식 정보 조회
import type { Cafe } from '../entities/Cafe.js';
import type { MenuRepository } from '../repositories/IMenuRepository.js';

export interface GetMenuForDateUseCase {
  execute: (date: Date) => Promise<Cafe[]>;
}

export const createGetMenuForDateUseCase = (
  { menuRepository }: { menuRepository: MenuRepository }
): GetMenuForDateUseCase => ({
  execute: (date: Date) => menuRepository.getMenuForDate(date),
});
