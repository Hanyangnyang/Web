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
  const titleLine = `${dateLabel} '${cafeName}' ${mealType}${mealEmoji} 공유하기`;
  const kakaoTitle = `${dateLabel} '${cafeName}' ${mealType}${mealEmoji} 메뉴는 뭘까요?`;
  const cleanMenu = stripHtml(menuText);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleKakao = () => {
    console.log('[Share] shareUrl:', shareUrl);
    console.log('[Share] shareUrl origin:', new URL(shareUrl).origin);
    console.log('[Share] kakaoTitle:', kakaoTitle);
    console.log('[Share] Kakao initialized:', window.Kakao?.isInitialized());
    console.log('[Share] __kakaoStatus:', window.__kakaoStatus);

    if (!window.Kakao) {
      console.error('[Share] window.Kakao 없음 (SDK_NOT_LOADED)');
      alert('카카오 SDK를 불러오지 못했어요.\n[오류 코드: SDK_NOT_LOADED]\n\nindex.html의 script 태그가 올바른지 확인해주세요.');
      return;
    }

    if (!window.Kakao.isInitialized()) {
      const status = window.__kakaoStatus ?? 'UNKNOWN';
      console.error(`[Share] Kakao 미초기화 (${status})`);
      if (status === 'NO_KEY') {
        alert('앱 키가 설정되어 있지 않아요.\n[오류 코드: NO_APP_KEY]\n\nVercel 환경변수 VITE_KAKAO_JS_KEY를 확인하고 재배포해주세요.');
      } else if (status === 'INIT_ERROR') {
        alert('SDK 초기화 중 오류가 발생했어요.\n[오류 코드: INIT_ERROR]\n\n카카오 개발자 콘솔에서 앱 키와 도메인 등록을 확인해주세요.');
      } else {
        alert('SDK가 아직 초기화되지 않았어요.\n[오류 코드: NOT_INITIALIZED]\n\n카카오 개발자 콘솔에서 도메인 등록 여부를 확인해주세요.');
      }
      return;
    }

    try {
      window.Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: kakaoTitle,
          description: '하냥냥에서 자세한 학식 정보를 확인해보세요.',
          imageUrl: 'https://www.hanyang.life/hanyang_cafeteria.jpg',
          imageWidth: 800,
          imageHeight: 500,
          link: { mobileWebUrl: shareUrl, webUrl: shareUrl },
        },
        // buttons: [
        //   {
        //     title: '하냥냥에서 학식 메뉴 보기',
        //     link: { mobileWebUrl: shareUrl, webUrl: shareUrl },
        //   },
        // ],
      });
      onClose();
    } catch (e) {
      const code = e?.code ?? e?.status ?? 'UNKNOWN';
      const msg = e?.message ?? String(e);
      console.error(`[Share] Kakao.Share.sendDefault 실패 (${code}):`, e);
      alert(`카카오톡 공유에 실패했어요.\n[오류 코드: ${code}]\n${msg}`);
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
          <button className="share-action-btn" onClick={handleShare}>
            <div className="share-action-icon share-action-icon--link">
              <Share2 size={20} color="#475569" />
            </div>
            <span>공유하기</span>
          </button>
        </div>
      </div>
    </div>
  );
}
