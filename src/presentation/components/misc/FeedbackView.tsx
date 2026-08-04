// 컴포넌트: 하냥냥에게 피드백 보내기
import { useState } from 'react';
import { Loader2, Laugh, Send } from 'lucide-react';
import { useFeedback } from '../../hooks/useFeedback.js';
import { useBackHandler } from '../../hooks/useBackHandler.js';
import { MiscSubViewHeader } from './MiscSubViewHeader.js';

interface FeedbackViewProps {
  onBack: () => void;
}

export function FeedbackView({ onBack }: FeedbackViewProps) {
  useBackHandler(onBack);
  const [content, setContent] = useState('');
  const { loading, submitted, error, submit } = useFeedback();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (trimmed.length < 5) {
      alert('피드백은 최소 5자 이상 작성해 주세요.');
      return;
    }

    try {
      await submit(trimmed);
      setContent('');
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    }
  };

  if (submitted) {
    return (
      <div className="pb-20 [animation:slideUp_0.4s_ease-out]">
        <div className="bg-emerald-50/70 border border-emerald-100/50 rounded-card p-8 text-center animate-[fadeIn_0.3s_ease] shadow-sm">
          <span className="text-4xl">🎉</span>
          <h4 className="text-emerald-900 font-extrabold text-[17px] mt-4">소중한 피드백이 전송되었어요</h4>
          <p className="text-emerald-700 text-xs font-bold mt-2 leading-relaxed">
            보내주신 의견을 바탕으로 더욱 유용하고<br />
            사랑받는 하냥냥을 만들어갈게요!
          </p>
          <div className="flex justify-center mt-6">
            <button
              onClick={onBack}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-full transition-all active:scale-95 shadow-sm"
            >
              확인
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20">
      <MiscSubViewHeader title="피드백 보내기" onBack={onBack} />

      <div className="bg-white border border-[#e2e8f0] rounded-card p-5 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.03)] [animation:slideUp_0.4s_ease-out]">
        <div className="flex items-center gap-2 mb-2">
          <Laugh size={18} className="text-hyu-blue-light" />
          <span className="font-extrabold text-[15px] text-text-main">하냥냥에게 피드백 보내기</span>
        </div>

        <p className="text-[#64748b] text-[11px] font-medium leading-relaxed mb-2">
          하냥냥은 여러분들의 소중한 의견을 듣고 싶어요<br />
          기능 제안, 오류 제보, 칭찬의 말 등 무엇이든 알려주세요!
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="하냥냥에게 바라는 점을 자유롭게 작성해 주세요. (5자 이상)"
            maxLength={1000}
            disabled={loading}
            className="w-full min-h-[140px] p-3.5 text-xs border border-[#cbd5e1] rounded-xl focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder-text-hint resize-none font-semibold transition-all bg-slate-50/30"
          />

          {error && (
            <p className="text-error text-[11px] font-bold">{error}</p>
          )}

          <div className="flex justify-between items-center">
            <span className="text-[10px] text-text-hint font-bold">
              {content.length} / 1000자
            </span>
            <button
              type="submit"
              disabled={loading || content.trim().length < 5}
              className="h-8 px-4 bg-hyu-blue-light hover:bg-[#2563eb] disabled:bg-slate-100 disabled:text-text-hint text-white font-extrabold text-xs rounded-full flex items-center justify-center gap-1.5 transition-all cursor-pointer select-none active:scale-[0.96] shadow-sm disabled:shadow-none"
            >
              {loading ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <>
                  <Send size={11} />
                  보내기
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
