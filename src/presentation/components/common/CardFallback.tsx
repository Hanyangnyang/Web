// ErrorBoundary가 카드 형태의 섹션을 대체할 때 쓰는 폴백. 조회(쿼리) 실패 상태를
// 보여주는 화면들(카페테리아/셔틀/헬스장)에서도 동일한 카드 모양이라 재사용한다 —
// onRetry를 넘기면 그 API를 재요청하는 "다시 시도" 버튼이 같이 뜬다.
import type { ReactNode } from 'react';
import { WifiOff } from 'lucide-react';

const DEFAULT_ICON = <WifiOff size={26} className="text-text-hint mb-1" />;
const DEFAULT_SUBTEXT = '불편을 드려 죄송해요. 잠시 후 다시 시도해 주세요.';

interface CardFallbackProps {
  message: string;
  onRetry?: () => void;
  className?: string;
  icon?: ReactNode; // 생략하면 WifiOff. 실패가 아닌 "정상인데 비어있음" 같은 상태를 같은 카드로 보여줄 때 교체용(예: 도서관좌석 운영 종료)
  subtext?: string; // 생략하면 사과 문구. 실패가 아닌 상태라 사과가 안 맞으면 ''로 꺼서 숨김
}

export function CardFallback({ message, onRetry, className = '', icon = DEFAULT_ICON, subtext = DEFAULT_SUBTEXT }: CardFallbackProps) {
  return (
    <div className={`bg-white rounded-card border border-slate-200 py-10 px-6 flex flex-col items-center justify-center gap-1.5 shadow-sm ${className}`}>
      {icon}
      <p className="text-center text-text-main text-[15px] font-extrabold">{message}</p>
      {subtext && <p className="text-center text-text-hint text-xs font-medium">{subtext}</p>}
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-1.5 bg-primary/90 text-white text-xs font-bold px-4 py-1.5 rounded-full active:scale-95 transition-transform shadow-[0_4px_12px_rgba(14,74,132,0.2)]"
        >
          다시 시도
        </button>
      )}
    </div>
  );
}
