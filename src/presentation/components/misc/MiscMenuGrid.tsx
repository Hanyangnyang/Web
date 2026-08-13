// 컴포넌트: 체대 헬스장·인스타그램 등 기타 서비스 진입 그리드
import { Dumbbell, CalendarDays, ExternalLink, Laugh } from 'lucide-react';

export type MiscBoxKey = 'gym' | 'insta' | 'calendar' | 'feedback';

const InstagramIcon = ({ size = 24, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const cardClass = "bg-white border border-slate-200 rounded-card aspect-square px-4 flex flex-col items-center justify-center text-center gap-3 cursor-pointer transition-all duration-200 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] hover:-translate-y-0.5 hover:border-hyu-blue-light hover:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1)] active:scale-[0.98]";

interface MiscMenuGridProps {
  onBoxClick: (box: MiscBoxKey) => void;
}

export function MiscMenuGrid({ onBoxClick }: MiscMenuGridProps) {
  return (
    <div className="-mt-2 pb-20 [animation:slideUp_0.4s_ease-out]">
      <h2 className="text-2xl font-extrabold text-text-main mb-1">기타 서비스</h2>
      <p className="text-base text-text-sub mb-4">학교 생활을 위한 유용한 기능 모음</p>

      <div className="grid grid-cols-2 gap-4">
        <div className={cardClass} onClick={() => onBoxClick('gym')}>
          <div className="w-14 h-14 bg-surface rounded-card flex items-center justify-center">
            <Dumbbell size={28} color="#64748B" />
          </div>
          <div className="flex flex-col">
            <span className="text-[0.95rem] font-extrabold text-text-main">체대 헬스장</span>
            <span className="text-[0.8rem] text-text-sub">시간표 조회</span>
          </div>
        </div>

        <div className={cardClass} onClick={() => onBoxClick('insta')}>
          <div className="w-14 h-14 bg-surface rounded-card flex items-center justify-center">
            <InstagramIcon size={28} color="#E4405F" />
          </div>
          <div className="flex flex-col">
            <span className="text-[0.95rem] font-extrabold text-text-main">학교 인스타그램</span>
            <span className="text-[0.8rem] text-text-sub">에리카 &amp; 단과대 계정</span>
          </div>
        </div>

        <div className={cardClass} onClick={() => onBoxClick('calendar')}>
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

        <div className={cardClass} onClick={() => onBoxClick('feedback')}>
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
          className="text-[0.78rem] text-text-hint underline underline-offset-2 hover:text-primary"
        >
          개인정보처리방침
        </a>
      </div>
    </div>
  );
}
