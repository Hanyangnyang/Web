import { WifiOff } from 'lucide-react';
import { useNetwork } from '../../context/NetworkContext';

export function OfflineModal() {
  const { isOnline } = useNetwork();
  if (isOnline) return null;

  return (
    <div
      className="fixed inset-0 bg-[rgba(15,23,42,0.78)] backdrop-blur-[6px] z-[10010] flex flex-col justify-center items-center gap-4 text-center select-none px-8"
      style={{ animation: 'fadeIn 0.25s ease-out' }}
      role="alert"
      aria-live="assertive"
    >
      <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-1">
        <WifiOff className="w-8 h-8 text-white" strokeWidth={1.75} />
      </div>
      <p className="text-white text-[1.05rem] font-bold tracking-tight leading-snug">
        네트워크가 연결되지 않았습니다🙀
      </p>
      <p className="text-white/60 text-[0.85rem] font-medium leading-relaxed whitespace-pre-line">
        {'인터넷 연결이 복구되면\n자동으로 계속 진행됩니다'}
      </p>
    </div>
  );
}
