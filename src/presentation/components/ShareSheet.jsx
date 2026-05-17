import React, { useEffect, useState } from 'react';
import { Share2 } from 'lucide-react';
import html2canvas from 'html2canvas';

const KakaoIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 3.5C7.03 3.5 3 6.75 3 10.75c0 2.6 1.63 4.89 4.1 6.24l-1.06 3.9 4.55-2.99c.45.07.9.1 1.41.1 4.97 0 9-3.25 9-7.25C21 6.75 16.97 3.5 12 3.5z"
      fill="#3A1D1D"
    />
  </svg>
);


export function ShareSheet({ cafeName, dateText, dateLabel, mealType, menuText, shareUrl, menuCardEl, onClose, onCopied }) {
  const mealEmoji = mealType.includes('조식') ? '☀️' : mealType.includes('석식') ? '🌙' : mealType.includes('천원') ? '💰' : '🍴';
  const mealLabel = mealType.includes('조식') || mealType.includes('천원') ? '아침'
    : mealType.includes('석식') ? '저녁'
    : '점심';
  const titleLine = `${dateLabel} ${cafeName} ${mealLabel}${mealEmoji} 공유하기`;
  const kakaoTitle = `${dateLabel} ${cafeName} ${mealLabel} 메뉴는 뭘까요?`;

  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleKakao = async () => {
    if (!window.Kakao) {
      alert('카카오 SDK를 불러오지 못했어요.\n[오류 코드: SDK_NOT_LOADED]');
      return;
    }
    if (!window.Kakao.isInitialized()) {
      const status = window.__kakaoStatus ?? 'UNKNOWN';
      if (status === 'NO_KEY') alert('앱 키가 설정되어 있지 않아요.\n[오류 코드: NO_APP_KEY]');
      else if (status === 'INIT_ERROR') alert('SDK 초기화 중 오류가 발생했어요.\n[오류 코드: INIT_ERROR]');
      else alert('SDK가 아직 초기화되지 않았어요.\n[오류 코드: NOT_INITIALIZED]');
      return;
    }

    setIsCapturing(true);
    let imageUrl = null;
    let imageWidth = null;
    let imageHeight = null;

    if (menuCardEl) {
      try {
        // pr-[6.5rem]은 가격 뱃지 겹침 방지용이므로 캡처 시 임시 제거
        const origPaddingRight = menuCardEl.style.paddingRight;
        menuCardEl.style.paddingRight = '0.25rem';

        const canvas = await html2canvas(menuCardEl, {
          scale: 2,
          backgroundColor: '#ffffff',
          useCORS: true,
          logging: false,
        });

        menuCardEl.style.paddingRight = origPaddingRight;

        imageWidth = canvas.width;
        imageHeight = canvas.height;
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        const file = new File([blob], 'menu.png', { type: 'image/png' });
        const res = await window.Kakao.Share.uploadImage({ file: [file] });
        imageUrl = res?.infos?.original?.url ?? null;
      } catch (err) {
        console.warn('[Share] 메뉴 카드 캡처/업로드 실패:', err);
      }
    }

    setIsCapturing(false);

    try {
      window.Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: kakaoTitle,
          ...(imageUrl ? { imageUrl, imageWidth, imageHeight } : {}),
          link: { mobileWebUrl: shareUrl, webUrl: shareUrl },
        },
        buttons: [{ title: '더 많은 학식 정보 확인하기', link: { mobileWebUrl: shareUrl, webUrl: shareUrl } }],
      });
      onClose();
    } catch (e) {
      const code = e?.code ?? e?.status ?? 'UNKNOWN';
      alert(`카카오톡 공유에 실패했어요.\n[오류 코드: ${code}]`);
    }
  };

  const handleShare = async () => {
    const baseUrl = window.location.origin;
    if (navigator.share) {
      try {
        await navigator.share({ title: kakaoTitle, url: baseUrl });
        onClose();
      } catch (e) {
        if (e.name !== 'AbortError') {
          await navigator.clipboard.writeText(baseUrl).catch(() => {});
          onClose();
          onCopied?.();
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(baseUrl);
      } catch {
        const el = document.createElement('textarea');
        el.value = baseUrl;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      }
      onClose();
      onCopied?.();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/45 z-[1200] flex items-end justify-center [animation:fadeIn_0.2s_ease]" onClick={onClose}>
      <div
        className="w-auto min-w-[260px] bg-white rounded-t-card px-8 pb-[calc(20px+env(safe-area-inset-bottom,0px))] [animation:sheetUp_0.3s_cubic-bezier(0.16,1,0.3,1)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-9 h-1 bg-[#e2e8f0] rounded-full mx-auto my-3" />
        <p className="text-base font-bold text-text-main text-center mb-5">{titleLine}</p>
        <div className="flex justify-center gap-6 pb-2">
          <button
            className="flex flex-col items-center gap-2 bg-none border-none cursor-pointer p-2 rounded-card transition-colors duration-150 font-[inherit] hover:bg-surface disabled:opacity-50"
            onClick={handleKakao}
            disabled={isCapturing}
          >
            <div className="w-[52px] h-[52px] rounded-card flex items-center justify-center bg-[#FEE500]">
              {isCapturing
                ? <div className="w-5 h-5 border-2 border-[#3A1D1D]/30 border-t-[#3A1D1D] rounded-full animate-spin" />
                : <KakaoIcon />}
            </div>
            <span className="text-xs font-semibold text-text-main">{isCapturing ? '준비 중...' : '카카오톡'}</span>
          </button>
          <button
            className="flex flex-col items-center gap-2 bg-none border-none cursor-pointer p-2 rounded-card transition-colors duration-150 font-[inherit] hover:bg-surface"
            onClick={handleShare}
          >
            <div className="w-[52px] h-[52px] rounded-card flex items-center justify-center bg-[#f1f5f9]">
              <Share2 size={20} color="#475569" />
            </div>
            <span className="text-xs font-semibold text-text-main">공유하기</span>
          </button>
        </div>
      </div>
    </div>
  );
}
