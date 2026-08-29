// 유스케이스: 백엔드 기본 범위(오늘 기준 약 1~2주)의 날짜별 식당 메뉴를 한 번에 조회
import type { Cafe } from '../entities/Cafe.js';
import type { MenuRepository } from '../repositories/IMenuRepository.js';

export interface GetMenuForPeriodUseCase {
  execute: () => Promise<Record<string, Cafe[]>>;
}

export const createGetMenuForPeriodUseCase = (
  { menuRepository }: { menuRepository: MenuRepository }
): GetMenuForPeriodUseCase => ({
  execute: () => menuRepository.getMenuForPeriod(),
});
