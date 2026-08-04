// 레포지토리: 학식 API 응답을 Cafe 엔티티 배열로 변환
import { createCafe } from '../../domain/entities/Cafe.js';
import type { MenuApiDataSource } from '../datasources/MenuApiDataSource.js';
import type { MenuRepository } from '../../domain/repositories/IMenuRepository.js';

export const createMenuRepository = (
  { menuApiDataSource }: { menuApiDataSource: MenuApiDataSource }
): MenuRepository => ({
  getMenus: async (dateStr: string) => {
    const data = await menuApiDataSource.getMenus(dateStr);
    if (!data.success) return [];
    return data.data.map(c => createCafe({
      id: c.id,
      name: c.name,
      menus: c.menus ?? [],
      hasJeyuk: c.hasJeyuk ?? false,
      available: c.available ?? false,
      hours: c.hours ?? {},
    }));
  },
});
