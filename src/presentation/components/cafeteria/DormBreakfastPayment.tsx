// 기숙사식당 조식 온라인 결제 안내 UI 조각 (상수·동작은 dormBreakfastPaymentConfig.ts)
import { useEffect, useState, type ReactNode } from 'react';
import { CreditCard, ExternalLink } from 'lucide-react';
import { DORM_BREAKFAST_PAYMENT_MESSAGE, openDormBreakfastPayment } from './dormBreakfastPaymentConfig.js';

// 아코디언 본문이 펼쳐지는 시간(index.css .accordion-content 0.3s)이 끝난 뒤 이어서 등장하도록
const REVEAL_DELAY_MS = 500;

// (카드 아이콘) 안내 문구 [결제하기 ↗] 한 줄 — compact: 아코디언 헤더 바로 아래 띠로 붙을 때 한 단계 작게
function PaymentLine({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${compact ? 'gap-2' : 'gap-2.5'}`}>
      <div className={`flex items-center min-w-0 ${compact ? 'gap-2' : 'gap-2.5'}`}>
        <CreditCard size={compact ? 13 : 15} strokeWidth={2.4} className="flex-shrink-0 text-primary" />
        {/* 메뉴 이름(text-main)과 같은 위계로 읽히지 않도록 보조 정보 색·굵기로 낮춘다 */}
        <span className={`${compact ? 'text-[12px]' : 'text-[13px]'} font-medium text-text-sub leading-snug`}>{DORM_BREAKFAST_PAYMENT_MESSAGE}</span>
      </div>
      <button
        onClick={e => {
          e.stopPropagation(); // 카드 클릭(식당 접기/펼치기)으로 번지지 않게
          openDormBreakfastPayment();
        }}
        className={`flex-shrink-0 inline-flex items-center gap-0.5 font-semibold rounded-full active:scale-95 transition-transform bg-primary/[0.06] text-primary ${compact ? 'text-[11px] px-2 py-0.5' : 'text-[12px] px-2.5 py-1'}`}
      >
        결제하기
        <ExternalLink size={compact ? 11 : 12} strokeWidth={2.75} style={{ opacity: 0.8 }} />
      </button>
    </div>
  );
}

// active가 켜지고 REVEAL_DELAY_MS 뒤에 높이가 늘어나며 등장, 꺼지면 바로 접힘
function DelayedReveal({ active, className, children }: { active: boolean; className: string; children: ReactNode }) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    // 펼칠 때는 아코디언 애니메이션이 끝난 뒤, 접을 때는 바로 반영
    const timer = setTimeout(() => setShown(active), active ? REVEAL_DELAY_MS : 0);
    return () => clearTimeout(timer);
  }, [active]);

  const open = active && shown;

  return (
    <div
      className="grid transition-[grid-template-rows] duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
      style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
    >
      <div className="overflow-hidden">
        <div className={`${className} transition-all duration-[400ms] ${open ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1.5'}`}>
          {children}
        </div>
      </div>
    </div>
  );
}

// "전체" 칩: 기숙사식당 조식을 펼친 뒤 메뉴 맨 아래(공유 버튼 아래)에 구분선과 함께 등장
export function DormBreakfastPaymentRow({ active }: { active: boolean }) {
  return (
    <DelayedReveal active={active} className="mt-1.5 pt-1.5 border-t border-slate-100">
      <PaymentLine compact />
    </DelayedReveal>
  );
}

// "기숙사식당" 칩: 조식 아코디언이 펼쳐진 뒤 헤더 바로 아래, 메뉴 위에 띠로 등장
export function DormBreakfastPaymentReveal({ active }: { active: boolean }) {
  return (
    <DelayedReveal active={active} className="px-5 py-1.5 border-b border-slate-100">
      <PaymentLine compact />
    </DelayedReveal>
  );
}
