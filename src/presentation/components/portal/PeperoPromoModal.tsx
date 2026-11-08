import { useState, useRef, useEffect } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { usePostHog } from 'posthog-js/react';
import { useBackHandler } from '../../hooks/useBackHandler.js';

interface PeperoPromoModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservationUrl?: string;
}

const DEFAULT_RESERVATION_URL = 'https://open.kakao.com/o/s3Rr6aWi';

export function PeperoPromoModal({
  isOpen,
  onClose,
  reservationUrl = DEFAULT_RESERVATION_URL,
}: PeperoPromoModalProps) {
  const posthog = usePostHog();
  const [closing, setClosing] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const autoCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 안드로이드 하드웨어 뒤로가기 키 지원
  useBackHandler(() => {
    handleClose();
  }, isOpen);

  useEffect(() => {
    if (isOpen) {
      posthog?.capture('pepero_promo_modal_opened');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // 언마운트 시 자동 닫힘 타이머 정리
  useEffect(() => {
    return () => {
      if (autoCloseTimeoutRef.current) {
        clearTimeout(autoCloseTimeoutRef.current);
      }
    };
  }, []);

  if (!isOpen) return null;

  const handleClose = () => {
    if (dontShowAgain) {
      try {
        localStorage.setItem('hide_pepero_auto_popup', 'true');
      } catch {}
    }
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      onClose();
    }, 200);
  };

  const handleCheckboxChange = (checked: boolean) => {
    setDontShowAgain(checked);
    if (checked) {
      try {
        localStorage.setItem('hide_pepero_auto_popup', 'true');
      } catch {}
      // 체크된 상태를 유저가 확인(250ms)한 뒤 바로 닫기
      autoCloseTimeoutRef.current = setTimeout(() => {
        handleClose();
      }, 250);
    }
  };

  const handleReservationClick = () => {
    posthog?.capture('pepero_reservation_clicked', { url: reservationUrl });
    if (reservationUrl) {
      window.open(reservationUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 sm:p-6">
      {/* 1. 백드롭 */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity duration-200 ${
          closing ? 'opacity-0' : 'opacity-100 animate-[fadeIn_0.2s_ease-out]'
        }`}
        onClick={handleClose}
      />

      {/* 2. 중앙 팝업 모달 컨테이너 */}
      <div
        ref={sheetRef}
        className={`relative z-10 w-full max-w-[420px] bg-white rounded-[28px] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden transition-all duration-200 ease-out ${
          closing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
      >
        {/* 상단 우측 닫기 버튼 */}
        <div className="pt-4 px-5 pb-1 flex justify-end bg-white shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 active:bg-slate-100 transition-colors"
            aria-label="닫기"
          >
            <X size={22} />
          </button>
        </div>

        {/* 3. 스크롤러블 홍보글 본문 */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-6 pb-24 overscroll-contain text-slate-800 text-[15px] leading-relaxed">
          
          {/* 큰 글씨 헤더 */}
          <div>
            <h2 className="text-[25px] sm:text-[27px] font-black text-slate-900 leading-tight tracking-tight">
              <span className="text-[#FF5D8F]">빼빼로데이</span>에는 진심을 전해요 🌸
            </h2>
          </div>

          {/* 개발자 인사말 */}
          <div className="space-y-1.5 text-slate-700">
            <p className="font-extrabold text-slate-900 text-base">
              안녕하세요! 하냥냥 개발자입니다
            </p>
            <p>
              빼빼로데이에 학교 쪽문에서 선물 세트를 판매합니다!
            </p>
          </div>

          {/* 🩷 핑크 & ❤️ 레드 병렬 2열 사진 비교 배치 */}
          <div className="grid grid-cols-2 gap-3.5">
            {/* 핑크 */}
            <div className="space-y-2">
              <div className="font-extrabold text-slate-900 flex items-center gap-1 text-[15px]">
                <span>🩷</span>
                <span>핑크</span>
              </div>
              <div className="aspect-[4/5] rounded-xl overflow-hidden bg-slate-100">
                <img
                  src="/assets/promo/pink-flower.jpg"
                  alt="핑크 거베라 + 딸기 빼빼로"
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-xs sm:text-[13px] font-semibold text-slate-700 leading-snug">
                핑크 거베라 + 딸기 빼빼로
              </p>
            </div>

            {/* 레드 */}
            <div className="space-y-2">
              <div className="font-extrabold text-slate-900 flex items-center gap-1 text-[15px]">
                <span>❤️</span>
                <span>레드</span>
              </div>
              <div className="aspect-[4/5] rounded-xl overflow-hidden bg-slate-100">
                <img
                  src="/assets/promo/red-flower.jpg"
                  alt="레드 거베라 + 오리지널 빼빼로"
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-xs sm:text-[13px] font-semibold text-slate-700 leading-snug">
                레드 거베라 + 오리지널 빼빼로
              </p>
            </div>
          </div>

          {/* 하냥냥 픽업 예약 혜택 */}
          <div className="space-y-2">
            <h3 className="font-black text-slate-900 text-lg sm:text-[19px] flex items-center gap-1.5">
              하냥냥 픽업 예약 혜택 🥰
            </h3>
            <p className="text-slate-600">
              이 게시물을 통해 픽업 예약하면 할인해드려요!
            </p>
            <div className="space-y-1 pt-1 text-[15px]">
              <div className="flex items-center gap-2 text-slate-600">
                <span>현장 구매시</span>
                <span className="font-semibold text-slate-400 line-through">11,111원</span>
              </div>
              <div className="flex items-baseline gap-2 text-slate-900">
                <span className="font-extrabold text-[#FF477E]">픽업 예약시</span>
                <span className="text-xl font-black text-[#FF477E]">10,000원</span>
              </div>
            </div>
          </div>

          {/* 운영 시간 및 장소 안내 */}
          <div className="space-y-3">
            <h3 className="font-black text-slate-900 text-base">
              운영 시간 및 장소 안내
            </h3>
            <div className="space-y-1.5 text-slate-700">
              <p>🗓️ 11월 11일 수요일, 11:00~15:00</p>
              <p>📍 학교 쪽문 주황색 부스(STARTUP)</p>
            </div>

            {/* 쪽문 부스 위치 사진 (이미지에 직접 '여기!' 화살표가 그려져 있음) */}
            <div className="w-full rounded-2xl overflow-hidden bg-slate-100 mt-2 shadow-sm">
              <img
                src="/assets/promo/booth-location.jpg"
                alt="학교 쪽문 주황색 부스 STARTUP 위치"
                className="w-full h-auto object-cover"
              />
            </div>
          </div>

          {/* 마무리 인사 */}
          <div className="pt-2 pb-1 text-slate-600 text-center font-medium space-y-1">
            <p>항상 하냥냥을 이용해주셔서 감사드려요</p>
            <p className="text-sm text-slate-500">성큼 찾아온 겨울에 감기 조심하세요</p>
          </div>

        </div>

        {/* 4. 하단 고정 액션 바 (카카오톡 오픈채팅 픽업 예약 + 다시 보지 않기) */}
        <div className="p-4 bg-white/95 backdrop-blur-md border-t border-slate-100 flex flex-col gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleReservationClick}
            className="w-full py-3.5 px-5 rounded-2xl bg-[#FEE500] hover:bg-[#fada0a] active:bg-[#f5d100] text-[#191919] font-extrabold text-base shadow-[0_4px_16px_rgba(254,229,0,0.4)] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {/* 카카오톡 로고 */}
            <svg
              className="w-5 h-5 shrink-0 fill-[#191919]"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M12 3c-5.523 0-10 3.582-10 8 0 2.828 1.864 5.313 4.672 6.742l-.974 3.606c-.084.312.253.56.52.403l4.242-2.812c.507.051 1.02.078 1.54.078 5.523 0 10-3.582 10-8s-4.477-8-10-8z" />
            </svg>
            <span>픽업 예약하기</span>
          </button>

          {/* 다시 보지 않기 체크박스 (체크 확인 후 팝업 닫힘) */}
          <div className="flex items-center justify-end pt-1">
            <label className="inline-flex items-center gap-2 cursor-pointer select-none text-[13.5px] sm:text-sm font-medium text-slate-500 hover:text-slate-700 active:text-slate-900 transition-colors py-1 px-1">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => handleCheckboxChange(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-[#FF477E] accent-[#FF477E] focus:ring-0 cursor-pointer"
              />
              <span>다시 보지 않기</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
