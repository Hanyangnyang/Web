// 컴포넌트: 메뉴 한 세트 (가격 배지 + 메뉴 줄들 + 공유 버튼). 마지막 줄에만 공유 버튼이 붙는다.
import { Share2 } from 'lucide-react';
import { MenuItemLine } from './MenuItemLine.js';
import { filterRealMenuItems } from './cafeteriaFormat.js';
import type { Menu } from '../../../domain/entities/Cafe.js';

interface MenuEntryProps {
  menu: Menu;
  priceLabel?: string;
  onShare: () => void;
}

export function MenuEntry({ menu, priceLabel, onShare }: MenuEntryProps) {
  const menuLines = filterRealMenuItems(menu.menuItems).map((item, i) => i === 0 ? `<b>${item}</b>` : item);

  return (
    <div className="relative">
      {priceLabel && (
        <div className="absolute top-0 right-0 text-primary font-bold text-[14px] bg-[rgba(14,74,132,0.06)] px-2 py-0.5 rounded z-[1]">
          {priceLabel}
        </div>
      )}
      <div className="text-[14px] text-text-main pr-20">
        {menuLines.slice(0, -1).map((line, idx) => (
          <MenuItemLine key={idx} html={line} />
        ))}
      </div>
      {menuLines.length > 0 && (
        <div className="flex items-center justify-between gap-2 text-[14px] text-text-main">
          <div className="flex-1 min-w-0">
            <MenuItemLine html={menuLines[menuLines.length - 1]} />
          </div>
          <button
            className="flex-shrink-0 min-w-[64px] flex items-center justify-center gap-1 h-7 px-2.5 border-none bg-primary/10 rounded-full text-primary text-[12px] font-bold cursor-pointer transition-all duration-150 hover:bg-primary/20 active:bg-primary active:text-white active:scale-95"
            onClick={(e) => { e.stopPropagation(); onShare(); }}
            aria-label="메뉴 공유"
          >
            <Share2 size={13} />
            공유
          </button>
        </div>
      )}
    </div>
  );
}
