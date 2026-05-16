import React, { useEffect } from 'react';
import { Share2 } from 'lucide-react';

const KakaoIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 3.5C7.03 3.5 3 6.75 3 10.75c0 2.6 1.63 4.89 4.1 6.24l-1.06 3.9 4.55-2.99c.45.07.9.1 1.41.1 4.97 0 9-3.25 9-7.25C21 6.75 16.97 3.5 12 3.5z"
      fill="#3A1D1D"
    />
  </svg>
);

function stripHtml(html) {
  return html.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').trim();
}

export function ShareSheet({ cafeName, dateText, dateLabel, mealType, menuText, shareUrl, onClose, onCopied }) {
  const mealEmoji = mealType.includes('조식') ? '☀️' : mealType.includes('석식') ? '🌙' : mealType.includes('천원') ? '💰' : '🍴';
  const titleLine = `${dateLabel} ${cafeName} ${mealType}${mealEmoji} 공유하기`;
  const kakaoTitle = `${dateLabel} ${cafeName} ${mealType}${mealEmoji} 메뉴는 뭘까요?`;
  const cleanMenu = stripHtml(menuText);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleKakao = () => {
    console.log('[Share] shareUrl:', shareUrl);
    console.log('[Share] kakaoTitle:', kakaoTitle);
    console.log('[Share] Kakao initialized:', window.Kakao?.isInitialized());

    if (!window.Kakao) {
      alert('카카오 SDK를 불러오지 못했어요.\n[오류 코드: SDK_NOT_LOADED]');
      return;
    }

    if (!window.Kakao.isInitialized()) {
      const status = window.__kakaoStatus ?? 'UNKNOWN';
      if (status === 'NO_KEY') {
        alert('앱 키가 설정되어 있지 않아요.\n[오류 코드: NO_APP_KEY]');
      } else if (status === 'INIT_ERROR') {
        alert('SDK 초기화 중 오류가 발생했어요.\n[오류 코드: INIT_ERROR]');
      } else {
        alert('SDK가 아직 초기화되지 않았어요.\n[오류 코드: NOT_INITIALIZED]');
      }
      return;
    }

    try {
      window.Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: kakaoTitle,
          imageUrl: 'https://www.hanyang.life/hanyang_cafeteria.jpg',
          imageWidth: 800,
          imageHeight: 500,
          link: { mobileWebUrl: shareUrl, webUrl: shareUrl },
        },
        buttons: [{ title: '학식 정보 확인하기', link: { mobileWebUrl: shareUrl, webUrl: shareUrl } }],
      });
      onClose();
    } catch (e) {
      const code = e?.code ?? e?.status ?? 'UNKNOWN';
      alert(`카카오톡 공유에 실패했어요.\n[오류 코드: ${code}]`);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: kakaoTitle, url: shareUrl });
        onClose();
      } catch (e) {
        if (e.name !== 'AbortError') {
          await navigator.clipboard.writeText(shareUrl).catch(() => {});
          onClose();
          onCopied?.();
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
      } catch {
        const el = document.createElement('textarea');
        el.value = shareUrl;
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
    <div className="fixed inset-0 bg-black/45 z-[1200] flex items-end justify-center pb-8 [animation:fadeIn_0.2s_ease]" onClick={onClose}>
      <div
        className="w-auto min-w-[260px] bg-white rounded-card px-8 pb-6 [animation:sheetUp_0.3s_cubic-bezier(0.16,1,0.3,1)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-9 h-1 bg-[#e2e8f0] rounded-full mx-auto my-3" />
        <p className="text-base font-bold text-text-main text-center mb-5">{titleLine}</p>
        <div className="flex justify-center gap-6 pb-2">
          <button
            className="flex flex-col items-center gap-2 bg-none border-none cursor-pointer p-2 rounded-card transition-colors duration-150 font-[inherit] hover:bg-surface"
            onClick={handleKakao}
          >
            <div className="w-[52px] h-[52px] rounded-card flex items-center justify-center bg-[#FEE500]">
              <KakaoIcon />
            </div>
            <span className="text-xs font-semibold text-text-main">카카오톡</span>
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
