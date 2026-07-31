// 도메인 레포지토리 인터페이스: 학식 정보 제공 계약 (구현은 data 레이어의 MenuRepository)
import type { Cafe } from '../entities/Cafe.js';

export interface MenuRepository {
  getMenus: (dateStr: string) => Promise<Cafe[]>;
}
