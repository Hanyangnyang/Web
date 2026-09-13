// ErrorBoundary가 바텀시트/모달 형태의 오버레이(알림 설정, 공유 시트 등)를 대체할 때 쓰는 폴백.
// fallback={null}이면 사용자가 닫을 방법이 없어 화면이 먹통이 되므로, 최소한 닫기 버튼은 준다.
interface ModalErrorFallbackProps {
  message: string;
  onClose: () => void;
}

export function ModalErrorFallback({ message, onClose }: ModalErrorFallbackProps) {
  return (
    <div className="fixed inset-0 z-[1100] bg-black/45 flex items-end justify-center" onClick={onClose}>
      <div
        className="bg-white rounded-t-2xl w-[calc(100%-48px)] max-w-[340px] mb-0 px-6 py-8 text-center shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-text-main text-[15px] font-extrabold mb-1">{message}</p>
        <p className="text-text-hint text-xs font-medium mb-5">잠시 후 다시 시도해 주세요.</p>
        <button
          onClick={onClose}
          className="px-6 py-2 rounded-full bg-primary text-white text-sm font-bold active:scale-95 transition-transform"
        >
          닫기
        </button>
      </div>
    </div>
  );
}
