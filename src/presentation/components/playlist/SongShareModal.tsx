import { Share2, X } from 'lucide-react';
import { useEffect } from 'react';
import { loadKakaoSdk } from '../../../lib/kakaoShare.js';
import { initSentry } from '../../../lib/sentry.js';
import { type TrackSummary } from './playlistTypes';

declare global {
  interface Window {
    Capacitor?: {
      Plugins?: {
        Share?: {
          share: (options: { text: string; dialogTitle?: string }) => Promise<void>;
        };
      };
    };
  }
}

const KakaoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 3.5C7.03 3.5 3 6.75 3 10.75c0 2.6 1.63 4.89 4.1 6.24l-1.06 3.9 4.55-2.99c.45.07.9.1 1.41.1 4.97 0 9-3.25 9-7.25C21 6.75 16.97 3.5 12 3.5z"
      fill="#3A1D1D"
    />
  </svg>
);

export type SongShareModalSong = TrackSummary;

interface SongShareModalProps {
  song: SongShareModalSong;
  onClose: () => void;
  onCopied?: () => void;
}

// 곡/게시글 공유 팝업 — 학식 공유(ShareSheet)의 바텀시트 대신, 플레이리스트 카드들과 톤을 맞춰
// 화면 중앙 팝업(AddSongView/PostDetailCard의 안내 팝업과 동일한 패턴)으로 구성
export function SongShareModal({ song, onClose, onCopied }: SongShareModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    loadKakaoSdk().catch(() => {});
  }, []);

  // 기타탭 > 플레이리스트로 진입시킨 뒤, trackId로 바로 그 곡의 게시글 모음(TrackPostCollectionView)까지 열게 함
  const shareUrl = `${window.location.origin}/?tab=misc&box=playlist&trackId=${encodeURIComponent(song.trackId)}`;
  const shareTitle = `${song.title} · ${song.artist}`;

  const handleKakao = async () => {
    try {
      await loadKakaoSdk();
    } catch (e) {
      const status = window.__kakaoStatus ?? 'UNKNOWN';
      initSentry().then((Sentry) => {
        Sentry.captureException(e, { tags: { source: 'playlist-share-load', status } });
      });
      if (status === 'NO_KEY') alert('앱 키가 설정되어 있지 않아요.\n[오류 코드: NO_APP_KEY]');
      else if (status === 'INIT_ERROR') alert('SDK 초기화 중 오류가 발생했어요.\n[오류 코드: INIT_ERROR]');
      else alert('카카오 SDK를 불러오지 못했어요.\n[오류 코드: SDK_NOT_LOADED]');
      return;
    }

    const link = { mobileWebUrl: shareUrl, webUrl: shareUrl };

    try {
      window.Kakao!.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: shareTitle,
          description: '이 곡 아는 사람?! 에리카 플레이리스트에서 확인해보세요 🎵',
          imageUrl: song.albumArtUrl,
          imageWidth: 800,
          imageHeight: 800,
          link,
        },
        buttons: [{ title: '이 곡 들으러 가기', link }],
      });
      onClose();
    } catch (e: any) {
      const code = e?.code ?? e?.status ?? 'UNKNOWN';
      initSentry().then((Sentry) => {
        Sentry.captureException(e, { tags: { source: 'playlist-share-send', code } });
      });
      alert(`카카오톡 공유에 실패했어요.\n[오류 코드: ${code}]`);
    }
  };

  const handleShare = async () => {
    const shareText = `하냥냥 - 에리카 플레이리스트\n${shareTitle}\n\n${shareUrl}`;

    const nativeShare = window.Capacitor?.Plugins?.Share;
    if (nativeShare) {
      try {
        await nativeShare.share({ text: shareText, dialogTitle: '공유하기' });
        onClose();
      } catch (e: any) {
        if (e?.message !== 'Share canceled') {
          await navigator.clipboard.writeText(shareText).catch(() => {});
          onClose();
          onCopied?.();
        }
      }
      return;
    }

    if (navigator.share) {
      try {
        await navigator.share({ text: shareText });
        onClose();
      } catch (e: any) {
        if (e.name !== 'AbortError') {
          await navigator.clipboard.writeText(shareText).catch(() => {});
          onClose();
          onCopied?.();
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
      } catch {
        const el = document.createElement('textarea');
        el.value = shareText;
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
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 px-8"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div
        className="relative w-full max-w-[220px] bg-white rounded-2xl shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="닫기"
          className="absolute top-1 right-1 z-10 p-1 text-text-hint hover:text-text-sub active:scale-90 transition-transform"
        >
          <X size={16} />
        </button>

        {/* 공유 대상 곡 미리보기 — 앨범커버를 크게 가운데 배치 */}
        <div className="flex flex-col items-center px-3 pt-12 pb-8">
          <img
            src={song.albumArtUrl}
            alt={song.title}
            className="w-28 h-28 rounded-2xl object-cover shadow-md bg-slate-100"
          />
          <div className="mt-3 max-w-full text-center">
            <div className="text-sm font-bold text-text-main truncate">{song.title}</div>
            <div className="text-xs text-text-sub truncate">{song.artist}</div>
          </div>
          <p className="mt-3 text-[11px] text-text-hint">친구에게 곡을 공유하여 함께 즐겨봐요!</p>
        </div>

        <div className="border-t border-slate-100" />

        <div className="flex justify-center gap-8 px-3 py-3">
          <button
            className="flex flex-col items-center gap-1.5 bg-none border-none cursor-pointer p-1 rounded-full transition-colors duration-150 font-[inherit] hover:bg-surface"
            onClick={handleKakao}
          >
            <div className="w-11 h-11 rounded-full flex items-center justify-center bg-[#FEE500]">
              <KakaoIcon />
            </div>
            <span className="text-[11px] font-semibold text-text-main">카카오톡</span>
          </button>
          <button
            className="flex flex-col items-center gap-1.5 bg-none border-none cursor-pointer p-1 rounded-full transition-colors duration-150 font-[inherit] hover:bg-surface"
            onClick={handleShare}
          >
            <div className="w-11 h-11 rounded-full flex items-center justify-center bg-slate-100">
              <Share2 size={16} className="text-text-sub" />
            </div>
            <span className="text-[11px] font-semibold text-text-main">링크 공유</span>
          </button>
        </div>
      </div>
    </div>
  );
}
