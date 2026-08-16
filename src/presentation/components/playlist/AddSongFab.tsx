import { Plus } from 'lucide-react';

interface AddSongFabProps {
  isPlayerOpen: boolean;
  onClick?: () => void;
}

export function AddSongFab({ isPlayerOpen, onClick }: AddSongFabProps) {
  return (
    <button
      onClick={onClick}
      aria-label="곡 추가"
      className="fixed right-[max(2.75rem,calc(50%-168px))] w-14 h-14 rounded-full bg-gradient-to-br from-neutral-800 to-black text-white flex items-center justify-center ring-1 ring-white/10 shadow-[0_10px_28px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.5)] hover:-translate-y-0.5 transition-[bottom,box-shadow,transform] duration-300 ease-out active:scale-90 z-40"
      style={{
        bottom: isPlayerOpen
          ? 'calc(312px + env(safe-area-inset-bottom))'
          : 'calc(24px + 64px + 24px + env(safe-area-inset-bottom))',
      }}
    >
      <Plus size={26} strokeWidth={2.5} />
    </button>
  );
}
