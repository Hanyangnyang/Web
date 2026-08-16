import { Heart, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { loadSpotifyIframeApi, type SpotifyEmbedController } from './spotifyIframeApi';

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
  const containerRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<SpotifyEmbedController | null>(null);

  useEffect(() => {
    if (song) {
      setDisplaySong(song);
      setClosing(false);
      return;
    }
    if (!displaySong) return;
    controllerRef.current?.pause();
    setClosing(true);
    const timer = setTimeout(() => {
      // 컨테이너 DOM이 사라지는 시점이라, 다음에 곡을 다시 열 때 새 컨트롤러를 만들도록 정리
      controllerRef.current?.destroy();
      controllerRef.current = null;
      setDisplaySong(null);
      setClosing(false);
    }, CLOSE_ANIMATION_MS);
    return () => clearTimeout(timer);
  }, [song]);

  // Spotify IFrame API로 controller.play()를 직접 호출해야 클릭에 이어지는 재생으로 인식되어
  // 브라우저 자동재생 정책에 걸리지 않고 안정적으로 바로 재생된다.
  useEffect(() => {
    if (!displaySong) return;
    const uri = `spotify:track:${displaySong.trackId}`;

    if (controllerRef.current) {
      // 이미 열려있는 상태에서 다른 곡으로 바꾸는 거라, 굳이 로딩 스켈레톤을 다시 보여줄 필요 없음
      controllerRef.current.loadUri(uri);
      controllerRef.current.play();
      return;
    }

    let cancelled = false;
    loadSpotifyIframeApi().then((IFrameAPI) => {
      if (cancelled || !containerRef.current || controllerRef.current) return;
      IFrameAPI.createController(
        containerRef.current,
        { uri, width: '100%', height: 152 },
        (controller) => {
          controllerRef.current = controller;
          controller.addListener('ready', () => setIframeLoaded(true));
          controller.play();
        }
      );
    });

    return () => {
      cancelled = true;
    };
  }, [displaySong?.trackId]);

  // 화면 자체를 완전히 벗어날 때(탭 이동 등)를 대비한 안전망
  useEffect(() => {
    return () => {
      controllerRef.current?.destroy();
      controllerRef.current = null;
    };
  }, []);

  if (!displaySong) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4">
      <div className="w-full max-w-[calc(440px-2rem)]">
        <div
          className="bg-black shadow-2xl border-t border-slate-200 rounded-t-lg overflow-hidden"
          style={{
            animation: closing ? 'sheetDown 0.25s cubic-bezier(0.4, 0, 1, 1) forwards' : 'sheetUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
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
            {/* Spotify IFrame API가 containerRef 노드를 자기 iframe으로 갈아치우기 때문에,
                이 스켈레톤을 조건부로 마운트/언마운트하면 리액트가 형제 노드 위치를 잘못 찾아 크래시 남.
                항상 마운트해두고 opacity로만 보이고/숨김 처리한다. */}
            <div
              className={`absolute inset-0 px-4 py-3 bg-white flex flex-col justify-between transition-opacity duration-200 ${
                iframeLoaded ? 'opacity-0 pointer-events-none' : 'opacity-100 animate-pulse'
              }`}
            >
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
            <div
              ref={containerRef}
              className={`w-full h-full rounded transition-opacity duration-200 ${iframeLoaded ? 'opacity-100' : 'opacity-0'}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
