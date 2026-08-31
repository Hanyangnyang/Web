import { ChevronRight } from 'lucide-react';
import { MiscSubViewHeader } from '../misc/MiscSubViewHeader';

interface MyActivityViewProps {
  onBack: () => void;
  onShowBookmarked: () => void;
  onShowMySongs: () => void;
}

const MENU_ITEMS = [
  { key: 'bookmarked', emoji: '🔖', title: '저장한 곡', subtitle: '내가 저장한 곡 게시글 모음' },
  { key: 'mySongs', emoji: '🎤', title: '내가 추천한 곡', subtitle: '내가 등록한 곡 모음' },
] as const;

// 홈 화면 우측 상단 사람 아이콘에서 진입하는 내 활동 허브 — 저장한 곡/내가 추천한 곡으로 이동
export function MyActivityView({ onBack, onShowBookmarked, onShowMySongs }: MyActivityViewProps) {
  const handleSelect = (key: (typeof MENU_ITEMS)[number]['key']) => {
    if (key === 'bookmarked') onShowBookmarked();
    else onShowMySongs();
  };

  return (
    <div className="pb-[calc(var(--playlist-bottom-space,204px)+env(safe-area-inset-bottom))] transition-[padding-bottom] duration-300 ease-out">
      <MiscSubViewHeader
        title="내 활동"
        emoji="🙋"
        subtitle="내가 저장하고 추천한 곡을 모아봤어요"
        onBack={onBack}
      />

      <div className="flex flex-col gap-3">
        {MENU_ITEMS.map((item) => (
          <button
            key={item.key}
            onClick={() => handleSelect(item.key)}
            className="flex items-center justify-between px-4 py-4 bg-white rounded-card border border-slate-200 shadow-[0_2px_4px_rgba(0,0,0,0.03)] hover:bg-slate-50 active:scale-[0.98] transition-all text-left"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{item.emoji}</span>
              <div>
                <div className="text-sm font-bold text-text-main">{item.title}</div>
                <div className="text-xs text-text-sub">{item.subtitle}</div>
              </div>
            </div>
            <ChevronRight size={20} className="text-text-sub flex-shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}
