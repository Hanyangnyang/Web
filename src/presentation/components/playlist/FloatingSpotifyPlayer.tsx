import { Heart, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Song {
  trackId: string;
  title: string;
  artist: string;
}

interface FloatingSpotifyPlayerProps {
  song: Song | null;
  onClose: () => void;
  onRequireLogin: () => void;
}

const CLOSE_ANIMATION_MS = 250;

export function FloatingSpotifyPlayer({ song, onClose, onRequireLogin }: FloatingSpotifyPlayerProps) {
  const [displaySong, setDisplaySong] = useState<Song | null>(song);
  const [closing, setClosing] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  useEffect(() => {
    if (song) {
      setDisplaySong(song);
      setClosing(false);
      return;
    }
    if (!displaySong) return;
    setClosing(true);
    const timer = setTimeout(() => {
      setDisplaySong(null);
      setClosing(false);
    }, CLOSE_ANIMATION_MS);
    return () => clearTimeout(timer);
  }, [song]);

  useEffect(() => {
    setIframeLoaded(false);
  }, [displaySong?.trackId]);

  if (!displaySong) return null;

  const embedUrl = `https://open.spotify.com/embed/track/${displaySong.trackId}`;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center">
      <div
        className="w-full max-w-app bg-black shadow-2xl border-t border-slate-200 rounded-t-lg overflow-hidden"
        style={{ animation: closing ? 'sheetDown 0.25s cubic-bezier(0.4, 0, 1, 1) forwards' : 'sheetUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-white/10">
          <div className="flex-1 min-w-0 text-sm font-semibold text-black truncate">
            {displaySong.title} <span className="font-normal">- {displaySong.artist}</span>
          </div>
          <button
            onClick={onRequireLogin}
            className="ml-2 flex-shrink-0 p-1 hover:bg-slate-100 rounded transition-colors active:scale-95"
          >
            <Heart size={18} className="text-red-500 stroke-[2]" />
          </button>
          <button
            onClick={onClose}
            className="ml-1 flex-shrink-0 p-1 hover:bg-slate-100 rounded transition-colors active:scale-95"
          >
            <X size={18} className="text-black" />
          </button>
        </div>

        {/* Spotify Embed */}
        <div className="relative bg-white h-[152px]">
          {!iframeLoaded && (
            <div className="absolute inset-0 px-4 py-3 bg-white animate-pulse flex flex-col justify-between">
              {/* 앨범아트 + 제목/아티스트/저장버튼 + 우측 상단 스포티파이 로고 */}
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-16 h-16 rounded bg-slate-200 flex-shrink-0" />
                  <div className="flex flex-col gap-2 pt-1">
                    <div className="h-3 w-32 rounded-full bg-slate-200" />
                    <div className="h-3 w-20 rounded-full bg-slate-200" />
                    <div className="h-5 w-28 rounded-full bg-slate-200 mt-1" />
                  </div>
                </div>
                <div className="w-6 h-6 rounded-full bg-slate-200 flex-shrink-0" />
              </div>

              {/* 진행바 + 시간/메뉴/재생버튼 */}
              <div className="flex flex-col gap-2">
                <div className="h-1 w-full rounded-full bg-slate-200" />
                <div className="flex items-center justify-between">
                  <div className="h-2 w-8 rounded-full bg-slate-200" />
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-4 rounded-full bg-slate-200" />
                    <div className="w-9 h-9 rounded-full bg-slate-300 flex-shrink-0" />
                  </div>
                </div>
              </div>
            </div>
          )}
          <iframe
            src={`${embedUrl}?utm_source=generator`}
            width="100%"
            height="152"
            frameBorder="0"
            allowFullScreen
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            onLoad={() => setIframeLoaded(true)}
            className={`rounded transition-opacity duration-200 ${iframeLoaded ? 'opacity-100' : 'opacity-0'}`}
          />
        </div>

        {/* 바텀네비게이션바 자리 확보용 흰색 여백 */}
        <div className="bg-white" style={{ height: 'calc(24px + 4rem + env(safe-area-inset-bottom))' }} />
      </div>
    </div>
  );
}
