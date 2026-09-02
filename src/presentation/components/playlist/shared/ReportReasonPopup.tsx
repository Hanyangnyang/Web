import { REPORT_REASONS } from './useSongReport';

interface ReportReasonPopupProps {
  selectedReason: string | null;
  onSelectReason: (reason: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
  isPending: boolean;
  isError: boolean;
}

// 신고 사유 선택 팝업 — PostDetailCard/TrackPostCollectionView가 공유. useSongReport와 짝을 이룸
export function ReportReasonPopup({ selectedReason, onSelectReason, onCancel, onConfirm, isPending, isError }: ReportReasonPopupProps) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 px-8"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-full max-w-[300px] bg-white rounded-2xl shadow-xl px-5 py-5">
        <p className="text-sm font-semibold text-text-main mb-3 text-center">신고 사유를 선택해주세요</p>
        <div className="flex flex-col gap-1.5 mb-4">
          {REPORT_REASONS.map((reason) => (
            <button
              key={reason}
              onClick={() => onSelectReason(reason)}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium border transition-colors active:scale-[0.98] ${
                selectedReason === reason
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'bg-slate-100 border-transparent text-text-sub hover:bg-slate-200'
              }`}
            >
              {reason}
            </button>
          ))}
        </div>
        {isError && (
          <p className="text-xs text-red-500 text-center mb-3">신고 접수에 실패했어요. 다시 시도해주세요.</p>
        )}
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 h-10 rounded-full text-sm font-bold text-text-sub bg-slate-100 active:scale-[0.97] transition-transform"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            disabled={!selectedReason || isPending}
            className={`flex-1 h-10 rounded-full text-sm font-bold active:scale-[0.97] transition-transform ${
              selectedReason && !isPending ? 'text-white bg-red-500' : 'text-slate-300 bg-slate-100'
            }`}
          >
            {isPending ? '접수 중...' : '신고하기'}
          </button>
        </div>
      </div>
    </div>
  );
}
