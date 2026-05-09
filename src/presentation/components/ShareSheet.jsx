import React, { useEffect } from 'react';
import { Link2 } from 'lucide-react';

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
  const titleLine = `[${cafeName}] ${dateText} ${mealType}`;
  const kakaoTitle = `${dateLabel}의 ${cafeName} ${mealType} 학식 메뉴는 뭘까요?`;
  const cleanMenu = stripHtml(menuText);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleKakao = () => {
    if (!window.Kakao?.isInitialized()) {
      console.warn('[Share] Kakao SDK 미초기화 — VITE_KAKAO_JS_KEY 또는 도메인 등록 확인 필요');
      alert('카카오톡 공유 기능을 불러오지 못했어요.\n카카오 앱이 설치된 모바일에서 다시 시도해주세요.');
      return;
    }
    try {
      window.Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: kakaoTitle,
          description: '하냥냥에서 자세한 학식 정보를 확인해보세요.',
          imageUrl: `${window.location.origin}/hanyang_splash.png`,
          link: { mobileWebUrl: shareUrl, webUrl: shareUrl },
        },
        buttons: [
          {
            title: '하냥냥으로 이동해서 학식 메뉴보기',
            link: { mobileWebUrl: shareUrl, webUrl: shareUrl },
          },
        ],
      });
      onClose();
    } catch (e) {
      console.error('[Share] Kakao.Share.sendDefault 실패:', e);
      alert('카카오톡 공유에 실패했어요. 잠시 후 다시 시도해주세요.');
    }
  };

  const handleCopy = async () => {
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
  };

  return (
    <div className="share-overlay" onClick={onClose}>
      <div className="share-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="share-sheet-handle" />
        <p className="share-sheet-label">{titleLine}</p>
        <div className="share-actions">
          <button className="share-action-btn" onClick={handleKakao}>
            <div className="share-action-icon share-action-icon--kakao">
              <KakaoIcon />
            </div>
            <span>카카오톡</span>
          </button>
          <button className="share-action-btn" onClick={handleCopy}>
            <div className="share-action-icon share-action-icon--link">
              <Link2 size={20} color="#475569" />
            </div>
            <span>링크 복사</span>
          </button>
        </div>
      </div>
    </div>
  );
}
