// 캠퍼스맵 제보하기 팝업 — 오픈스페이스·흡연장 등 지도 정보가 다르거나 빠졌을 때 자유 텍스트로 제보
import { useState } from 'react';
import { useSubmitFeedbackApi } from '../../hooks/useSubmitFeedbackApi.js';

interface CampusFeedbackModalProps {
  onClose: () => void;
}

const MAX_LENGTH = 300;

export function CampusFeedbackModal({ onClose }: CampusFeedbackModalProps) {
  const [content, setContent] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const submitFeedback = useSubmitFeedbackApi();

  const canSubmit = content.trim().length > 0 && !submitFeedback.isPending;

  const handleSubmit = () => {
    if (!canSubmit) return;
    submitFeedback.mutate(
      { category: 'CAMPUS_MAP', feedbackType: 'INACCURACY', content: content.trim() },
      { onSuccess: () => setSubmitted(true) }
    );
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 px-8"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[320px] bg-white rounded-2xl shadow-xl px-5 py-5"
        onClick={(e) => e.stopPropagation()}
      >
        {submitted ? (
          <div className="text-center py-2">
            <p className="text-2xl mb-2">📢</p>
            <p className="text-sm font-semibold text-text-main mb-1">제보 감사합니다!</p>
            <p className="text-xs text-text-sub mb-4">확인 후 지도에 반영할게요.</p>
            <button
              onClick={onClose}
              className="w-full h-10 rounded-full text-sm font-bold text-white bg-primary active:scale-[0.97] transition-transform"
            >
              닫기
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm font-semibold text-text-main mb-1 text-center">캠퍼스맵 제보하기</p>
            <p className="text-xs text-text-sub mb-3 text-center">
              오픈스페이스·흡연장 등 지도 정보가 다르거나 빠졌다면 알려주세요
            </p>
            <textarea
              value={content}
              maxLength={MAX_LENGTH}
              onChange={(e) => setContent(e.target.value)}
              placeholder="예: OO관 1층에 흡연장이 있는데 지도엔 안 보여요"
              rows={4}
              className="w-full bg-surface border border-[#e2e8f0] rounded-xl px-3 py-2.5 text-sm text-text-main placeholder-text-hint outline-none resize-none focus:border-primary"
            />
            <div className="text-right text-[11px] text-text-hint mt-1 mb-3">
              {content.length}/{MAX_LENGTH}
            </div>
            {submitFeedback.isError && (
              <p className="text-xs text-red-500 text-center mb-3">제보 접수에 실패했어요. 다시 시도해주세요.</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 h-10 rounded-full text-sm font-bold text-text-sub bg-slate-100 active:scale-[0.97] transition-transform"
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className={`flex-1 h-10 rounded-full text-sm font-bold active:scale-[0.97] transition-transform ${
                  canSubmit ? 'text-white bg-primary' : 'text-slate-300 bg-slate-100'
                }`}
              >
                {submitFeedback.isPending ? '접수 중...' : '제보하기'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
