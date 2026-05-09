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

export function ShareSheet({ cafeName, dateText, mealType, menuText, shareUrl, onClose, onCopied }) {
  const titleLine = `[${cafeName}] ${dateText} ${mealType}`;
  const cleanMenu = stripHtml(menuText);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleKakao = () => {
    if (window.Kakao?.isInitialized()) {
      const imageUrl = `${window.location.origin}/hanyang_splash.png`;
      window.Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: titleLine,
          description: cleanMenu.slice(0, 100),
          imageUrl,
          link: { mobileWebUrl: shareUrl, webUrl: shareUrl },
        },
        buttons: [
          {
            title: '메뉴 보러가기',
            link: { mobileWebUrl: shareUrl, webUrl: shareUrl },
          },
        ],
      });
      onClose();
      return;
    }
    if (navigator.share) {
      navigator.share({ title: titleLine, text: cleanMenu, url: shareUrl }).catch(() => {});
      onClose();
      return;
    }
    alert('카카오톡 공유는 모바일에서 이용해주세요.');
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
