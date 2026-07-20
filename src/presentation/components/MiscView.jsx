// 컴포넌트: 체대 헬스장·인스타그램 등 기타 서비스 진입 그리드
import React, { useState, useEffect } from 'react';
import { Dumbbell, CalendarDays, ExternalLink, Loader2, Laugh, Send, ArrowLeft } from 'lucide-react';
import { usePostHog } from 'posthog-js/react';
import { GymTimetable } from './GymTimetable.jsx';
import { InstagramListView } from './InstagramListView.jsx';
import { pushBackHandler, popBackHandler } from '../../lib/androidBackHandler.js';
import { supabase } from '../../lib/supabase.js';
import { getPlatform } from '../../lib/platform.js';

const InstagramIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const cardClass = "bg-white border border-[#e2e8f0] rounded-card aspect-square px-4 flex flex-col items-center justify-center text-center gap-3 cursor-pointer transition-all duration-200 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] hover:-translate-y-0.5 hover:border-hyu-blue-light hover:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1)] active:scale-[0.98]";

function FeedbackSection({ onBack }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (trimmed.length < 5) {
      alert('피드백은 최소 5자 이상 작성해 주세요.');
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      let userId = session?.user?.id;

      if (!userId) {
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error) throw error;
        userId = data.session.user.id;
      }

      const { error } = await supabase.from('feedbacks').insert({
        user_id: userId,
        content: trimmed,
        platform: getPlatform()
      });

      if (error) throw error;

      setSubmitted(true);
      setContent('');
    } catch (err) {
      console.error('Failed to submit feedback:', err);
      alert('피드백 전송에 실패했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setLoading(false);
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
    <div className="pb-20 [animation:slideUp_0.4s_ease-out]">
      <div className="flex items-center gap-4 mb-5">
        <button
          className="w-10 h-10 rounded-card bg-white border border-[#e2e8f0] flex items-center justify-center cursor-pointer text-text-main transition-all duration-200 hover:bg-surface"
          onClick={onBack}
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-xl font-bold text-text-main mb-0">피드백 보내기</h2>
      </div>

      <div className="bg-white border border-[#e2e8f0] rounded-card p-5 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.03)]">
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

export function MiscView({ resetSignal }) {
  const posthog = usePostHog();
  const [subView, setSubView] = useState('list');

  useEffect(() => {
    setSubView('list');
  }, [resetSignal]);

  useEffect(() => {
    if (subView === 'list') return;
    pushBackHandler(() => setSubView('list'));
    return () => popBackHandler();
  }, [subView]);

  const handleBoxClick = (box) => {
    posthog?.capture('misc_box_clicked', { box });
    if (box === 'calendar') {
      window.open('https://www.hanyang.ac.kr/-93', '_blank', 'noopener,noreferrer');
    } else {
      setSubView(box);
    }
  };

  if (subView === 'gym') return <GymTimetable onBack={() => setSubView('list')} />;
  if (subView === 'insta') return <InstagramListView onBack={() => setSubView('list')} />;
  if (subView === 'feedback') return <FeedbackSection onBack={() => setSubView('list')} />;

  return (
    <div className="-mt-2 pb-20 [animation:slideUp_0.4s_ease-out]">
      <h2 className="text-2xl font-extrabold text-text-main mb-1">기타 서비스</h2>
      <p className="text-base text-text-sub mb-4">학교 생활을 위한 유용한 기능 모음</p>

      <div className="grid grid-cols-2 gap-4">
        <div className={cardClass} onClick={() => handleBoxClick('gym')}>
          <div className="w-14 h-14 bg-surface rounded-card flex items-center justify-center">
            <Dumbbell size={28} color="#64748B" />
          </div>
          <div className="flex flex-col">
            <span className="text-[0.95rem] font-extrabold text-text-main">체대 헬스장</span>
            <span className="text-[0.8rem] text-text-sub">시간표 조회</span>
          </div>
        </div>

        <div className={cardClass} onClick={() => handleBoxClick('insta')}>
          <div className="w-14 h-14 bg-surface rounded-card flex items-center justify-center">
            <InstagramIcon size={28} color="#E4405F" />
          </div>
          <div className="flex flex-col">
            <span className="text-[0.95rem] font-extrabold text-text-main">학교 인스타그램</span>
            <span className="text-[0.8rem] text-text-sub">에리카 &amp; 단과대 계정</span>
          </div>
        </div>

        <div className={cardClass} onClick={() => handleBoxClick('calendar')}>
          <div className="w-14 h-14 bg-surface rounded-card flex items-center justify-center">
            <CalendarDays size={28} color="#0E4A84" />
          </div>
          <div className="flex flex-col">
            <span className="text-[0.95rem] font-extrabold text-text-main inline-flex items-center justify-center gap-0.5">
              학사 일정
              <ExternalLink size={14} strokeWidth={2.75} style={{ opacity: 0.8 }} />
            </span>
            <span className="text-[0.8rem] text-text-sub">에리카 학사 캘린더</span>
          </div>
        </div>

        <div className={cardClass} onClick={() => handleBoxClick('feedback')}>
          <div className="w-14 h-14 bg-surface rounded-card flex items-center justify-center">
            <Laugh size={28} color="#3b82f6" />
          </div>
          <div className="flex flex-col">
            <span className="text-[0.95rem] font-extrabold text-text-main">피드백 하기</span>
            <span className="text-[0.8rem] text-text-sub">작은 의견도 큰 힘이 돼요:)</span>
          </div>
        </div>
      </div>

      <div className="mt-4 text-center">
        <a
          href="https://app.notion.com/p/361325c5461f80aa8463ee5ae404d4ba?source=copy_link"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[0.78rem] text-text-hint underline underline-offset-2 hover:text-[#0e4a84]"
        >
          개인정보처리방침
        </a>
      </div>
    </div>
  );
}
