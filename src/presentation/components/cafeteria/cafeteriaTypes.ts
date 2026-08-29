// 학식 탭 컴포넌트들이 공유하는 데이터 모양
import type { Menu } from '../../../domain/entities/Cafe.js';

// "전체" 모드에서 이 메뉴가 어느 식당 것인지 구분하기 위해 붙이는 필드.
// 단일 식당 모드에서도 동일한 모양으로 통일해 MealTypeAccordion이 모드 분기 없이 다룰 수 있게 한다.
export interface MenuWithCafe extends Menu {
  cafeName: string;
  cafeId: string;
}

export interface ShareTarget {
  type: string;
  menu: Menu;
  shareUrl: string;
  dateLabel: string;
  cafeName: string;
}
