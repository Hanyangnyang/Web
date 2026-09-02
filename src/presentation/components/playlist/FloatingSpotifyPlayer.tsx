import { Play, Share2, X } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { loadSpotifyIframeApi, type SpotifyEmbedController } from './spotifyIframeApi';
import { isIOSDevice } from '../../../lib/platform.js';
import { useShareModal } from './useShareModal';
import { type TrackSummary } from './playlistTypes';

// play() 호출 후 이 시간 안에 실제로 재생이 시작 안 되면 자동재생이 막힌 것으로 보고
// "탭해서 재생하기" 버튼을 띄운다. iOS Safari 자동재생 정책 때문에 필요 — Android/데스크톱은 이 정책이 없어서 해당 없음.
const AUTOPLAY_CHECK_MS = 1500;

export type PlayableTrack = TrackSummary;

interface FloatingSpotifyPlayerProps {
  song: PlayableTrack | null;
  onClose: () => void;
  // 실제 렌더링된 플레이어 카드 높이(safe-area 포함)를 전달 — 닫히면 0
  onHeightChange?: (height: number) => void;
}

const CLOSE_ANIMATION_MS = 250;

export function FloatingSpotifyPlayer({ song, onClose, onHeightChange }: FloatingSpotifyPlayerProps) {
  const [displaySong, setDisplaySong] = useState<PlayableTrack | null>(song);
  const [closing, setClosing] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [showTapToPlay, setShowTapToPlay] = useState(false);
  // displaySong이 null(닫힘 상태)이어도 훅은 항상 호출돼야 해서 빈 값으로 대체 — 실제로는
  // displaySong이 있을 때만 공유 버튼이 렌더링되므로 open()이 빈 값으로 호출될 일은 없음
  const share = useShareModal(displaySong ?? { trackId: '', title: '', artist: '', albumArtUrl: '' });
  const containerRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<SpotifyEmbedController | null>(null);
  const isPausedRef = useRef(true);
  const autoplayCheckTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 재생 시작 후 일정 시간 안에 실제로 재생이 시작되지 않으면 자동재생이 막힌 것으로 보고 "탭해서 재생하기" 버튼을 띄운다.
  // 이 자동재생 차단은 iOS Safari 정책이라 iOS 기기가 아니면 애초에 검사할 필요가 없음
  const schedulePlaybackCheck = () => {
    if (!isIOSDevice()) return;
    if (autoplayCheckTimerRef.current) clearTimeout(autoplayCheckTimerRef.current);
    autoplayCheckTimerRef.current = setTimeout(() => {
      if (isPausedRef.current) setShowTapToPlay(true);
    }, AUTOPLAY_CHECK_MS);
  };

  // "탭해서 재생하기" 버튼 클릭 시 controller.play()를 호출하여 재생을 시도한다.
  const handleTapToPlay = () => {
    controllerRef.current?.play();
    setShowTapToPlay(false);
  };

  // song prop이 바뀌면 displaySong을 업데이트하고, song이 null이면 닫기 애니메이션 후 controller를 destroy한다.
  useEffect(() => {
    if (song) {
      setDisplaySong(song);
      setClosing(false);
      return;
    }
    if (!displaySong) return;
    controllerRef.current?.pause();
    if (autoplayCheckTimerRef.current) clearTimeout(autoplayCheckTimerRef.current);
    setShowTapToPlay(false);
    setClosing(true);
    const timer = setTimeout(() => {
      controllerRef.current?.destroy();
      controllerRef.current = null;
      setDisplaySong(null);
      setClosing(false);
    }, CLOSE_ANIMATION_MS);
    return () => clearTimeout(timer);
  }, [song]);

  // 곡이 바뀔때마다 Spotify 컨트롤러를 새로 만들거나 재사용해서 실제 재생을 트리거함.
  // displaySong이 바뀌면 Spotify IFrame API를 로드하고 controller를 생성하여 재생을 시작한다.
  // controller가 이미 존재하면 loadUri() 후 play()를 호출한다.
  useEffect(() => {
    if (!displaySong) return;
    const uri = `spotify:track:${displaySong.trackId}`;

    setShowTapToPlay(false);
    isPausedRef.current = true;

    if (controllerRef.current) {
      controllerRef.current.loadUri(uri);
      controllerRef.current.play();
      schedulePlaybackCheck();
      return;
    }

    let cancelled = false;
    loadSpotifyIframeApi().then((IFrameAPI) => {
      if (cancelled || !containerRef.current || controllerRef.current) return;
      IFrameAPI.createController(
        containerRef.current,
        { uri, width: '100%', height: 80 },
        (controller) => {
          controllerRef.current = controller;
          controller.addListener('ready', () => setIframeLoaded(true));
          controller.addListener('playback_update', (e: { data: { isPaused: boolean } }) => {
            isPausedRef.current = e.data.isPaused;
            if (!e.data.isPaused) setShowTapToPlay(false);
          });
          controller.play();
          schedulePlaybackCheck();
        }
      );
    });

    return () => {
      cancelled = true;
    };
  }, [displaySong?.trackId]);

  // 컴포넌트가 완전히 사라질때 컨트롤러/타이머를 정리하는 안전망.
  // FloatingSpotifyPlayer가 언마운트될 때 controller가 존재하면 destroy()를 호출하고, autoplayCheckTimer를 clearTimeout한다.
  // controller가 존재하면 destroy()를 호출하고, autoplayCheckTimer를 clearTimeout한다.
  useEffect(() => {
    return () => {
      controllerRef.current?.destroy();
      controllerRef.current = null;
      if (autoplayCheckTimerRef.current) clearTimeout(autoplayCheckTimerRef.current);
    };
  }, []);

  // 플레이어 카드의 실제 높이를 측정해 상위로 전달 — 하단 화면들의 여백/FAB 위치 계산에 쓰임.
  // displaySong이 null이 되면(닫힘 애니메이션까지 끝난 뒤) 0을 보고해 여백도 함께 줄어들게 한다.
  useLayoutEffect(() => {
    if (!displaySong) {
      onHeightChange?.(0);
      return;
    }
    const el = sheetRef.current;
    if (!el) return;
    const report = () => onHeightChange?.(el.offsetHeight);
    report();
    const observer = new ResizeObserver(report);
    observer.observe(el);
    return () => observer.disconnect();
  }, [displaySong, onHeightChange]);

  if (!displaySong) return null;

  return (
    // z-40이 아니라 z-[150]인 이유: 화면 상단 sticky 헤더가 z-[100]이라, 이 안에 있는
    // 공유 팝업(z-[200])이 그보다 낮으면 fixed+z-index로 생기는 자체 stacking context에 갇혀서
    // 팝업이 헤더 뒤로 깔려버림 — 바깥 래퍼 자체를 헤더보다 높여야 안쪽 z-index가 의미가 있음
    <div className="fixed inset-x-0 bottom-0 z-[150] flex justify-center">
      <div className="w-full max-w-app">
        <div
          ref={sheetRef}
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
              onClick={() => share.open()}
              aria-label="공유하기"
              className="ml-2 flex-shrink-0 p-1 hover:bg-slate-100 rounded transition-colors active:scale-95"
            >
              <Share2 size={18} className="text-black" />
            </button>
            <button
              onClick={onClose}
              aria-label="닫기"
              className="ml-1 flex-shrink-0 p-1 hover:bg-slate-100 rounded transition-colors active:scale-95"
            >
              <X size={18} className="text-black" />
            </button>
          </div>

          {/* Spotify Embed — 압축(80px) 버전: 앨범아트+제목/가수명+재생버튼이 한 줄 */}
          <div className="relative bg-white h-[80px]">
            <div
              className={`absolute inset-0 px-3 flex items-center gap-3 bg-white transition-opacity duration-200 ${
                iframeLoaded ? 'opacity-0 pointer-events-none' : 'opacity-100 animate-pulse'
              }`}
            >
              <div className="w-12 h-12 rounded bg-slate-200 flex-shrink-0" />
              <div className="flex-1 min-w-0 flex flex-col gap-2">
                <div className="h-3 w-32 rounded-full bg-slate-200" />
                <div className="h-3 w-20 rounded-full bg-slate-200" />
              </div>
              <div className="w-9 h-9 rounded-full bg-slate-300 flex-shrink-0" />
            </div>
            <div
              ref={containerRef}
              className={`w-full h-full rounded transition-opacity duration-200 ${iframeLoaded ? 'opacity-100' : 'opacity-0'}`}
            />

            {/* iOS Safari 등 자동재생이 막힌 경우에만 노출되는 수동 재생 버튼.
                containerRef와 같은 부모의 형제 노드라 조건부 마운트/언마운트하면 안 되고(크래시 이슈),
                항상 마운트해두고 opacity로만 보이고/숨김 처리한다. */}
            <button
              onClick={handleTapToPlay}
              aria-label="탭해서 재생하기"
              className={`absolute inset-0 z-20 flex items-center justify-center bg-black/50 transition-opacity duration-200 ${
                showTapToPlay ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              <span className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white text-black text-sm font-bold shadow-lg">
                <Play size={18} fill="black" />
                탭해서 재생하기
              </span>
            </button>
          </div>
        </div>
      </div>

      {share.node}
    </div>
  );
}
