import { useEffect, useRef, useState, type SyntheticEvent } from 'react';
import { Music2 } from 'lucide-react';
import { type ChartTrack } from '../../../../domain/entities/PopularityChart.js';
import { type ChartPeriod, type Song, type TrackSummary } from '../playlistTypes.js';

type PromoSource = 'recent' | 'popular' | 'weekly';

interface TrackPromo {
  source: PromoSource;
  track: TrackSummary;
  message: string;
  recentSong?: Song;
  chartTrack?: ChartTrack;
}

interface TrackPromoCarouselProps {
  recentSongs: readonly Song[];
  popularTracks: readonly ChartTrack[];
  weeklyTracks: readonly ChartTrack[];
  isActive?: boolean;
  onSelectRecent: (song: Song) => void;
  onSelectChart: (track: ChartTrack, period: Extract<ChartPeriod, 'popular' | 'weekly'>) => void;
}

const AUTO_SLIDE_MS = 7000;
const TRANSITION_MS = 300;
const PROMO_CACHE_TTL_MS = 10 * 60 * 1000;
export const TRACK_PROMO_CACHE_KEY = 'playlistTrackPromos:v2';
const RECENT_MESSAGES = ['누군가 추천했어요', '혹시, 이 노래 알아요?'] as const;

interface CachedPromoSelection {
  expiresAt: number;
  recentTrackIds: [string | null, string | null];
  popularTrackId: string | null;
  weeklyTrackId: string | null;
}

interface PromoSelection {
  recent: [Song | undefined, Song | undefined];
  popular: ChartTrack | undefined;
  weekly: ChartTrack | undefined;
}

interface EdgePalette {
  edge: string;
  middle: string;
  end: string;
}

function randomItem<T>(items: readonly T[]): T | undefined {
  return items[Math.floor(Math.random() * items.length)];
}

function randomItemPreferringUnused<T extends { trackId: string }>(items: readonly T[], usedTrackIds: ReadonlySet<string>): T | undefined {
  const unused = items.filter((item) => !usedTrackIds.has(item.trackId));
  return randomItem(unused.length > 0 ? unused : items);
}

function createRandomSelection(recentSongs: readonly Song[], popularTracks: readonly ChartTrack[], weeklyTracks: readonly ChartTrack[]): PromoSelection {
  const recentCandidates = recentSongs.slice(0, 10);
  const firstRecent = randomItem(recentCandidates);
  const usedTrackIds = new Set(firstRecent ? [firstRecent.trackId] : []);
  // 최근 곡 두 장은 같은 음악을 중복 노출하지 않는다. 후보가 한 곡뿐이면 두 번째 장 자체를 생략한다.
  const secondRecent = randomItem(recentCandidates.filter((song) => !usedTrackIds.has(song.trackId)));
  if (secondRecent) usedTrackIds.add(secondRecent.trackId);
  const popular = randomItemPreferringUnused(popularTracks.slice(0, 10), usedTrackIds);
  if (popular) usedTrackIds.add(popular.trackId);
  const weekly = randomItemPreferringUnused(weeklyTracks.slice(0, 10), usedTrackIds);
  return {
    recent: [firstRecent, secondRecent],
    popular,
    weekly,
  };
}

function getCachedSelection(recentSongs: readonly Song[], popularTracks: readonly ChartTrack[], weeklyTracks: readonly ChartTrack[]): PromoSelection {
  const recentCandidates = recentSongs.slice(0, 10);
  const popularCandidates = popularTracks.slice(0, 10);
  const weeklyCandidates = weeklyTracks.slice(0, 10);

  try {
    const cached = JSON.parse(localStorage.getItem(TRACK_PROMO_CACHE_KEY) ?? 'null') as CachedPromoSelection | null;
    if (cached && cached.expiresAt > Date.now()) {
      const firstRecent = recentCandidates.find((song) => song.trackId === cached.recentTrackIds[0]);
      const secondRecent = recentCandidates.find((song) => song.trackId === cached.recentTrackIds[1]);
      const popular = popularCandidates.find((track) => track.trackId === cached.popularTrackId);
      const weekly = weeklyCandidates.find((track) => track.trackId === cached.weeklyTrackId);
      const recentIsValid = recentCandidates.length === 0
        ? cached.recentTrackIds[0] === null && cached.recentTrackIds[1] === null
        : recentCandidates.length === 1
          ? !!firstRecent && cached.recentTrackIds[1] === null
          : !!firstRecent && !!secondRecent && firstRecent.trackId !== secondRecent.trackId;
      const popularIsValid = popularCandidates.length === 0 ? cached.popularTrackId === null : !!popular;
      const weeklyIsValid = weeklyCandidates.length === 0 ? cached.weeklyTrackId === null : !!weekly;
      if (recentIsValid && popularIsValid && weeklyIsValid) return { recent: [firstRecent, secondRecent], popular, weekly };
    }
  } catch {
    // 저장소를 사용할 수 없거나 이전 값이 손상됐으면 이번 마운트에서만 새로 뽑는다.
  }

  const selection = createRandomSelection(recentCandidates, popularCandidates, weeklyCandidates);
  const cached: CachedPromoSelection = {
    expiresAt: Date.now() + PROMO_CACHE_TTL_MS,
    recentTrackIds: [selection.recent[0]?.trackId ?? null, selection.recent[1]?.trackId ?? null],
    popularTrackId: selection.popular?.trackId ?? null,
    weeklyTrackId: selection.weekly?.trackId ?? null,
  };
  try {
    localStorage.setItem(TRACK_PROMO_CACHE_KEY, JSON.stringify(cached));
  } catch {
    // 비공개 모드 등에서 저장이 막혀도 배너 자체는 정상 노출한다.
  }
  return selection;
}

function darken([red, green, blue]: number[], amount: number): string {
  return `rgb(${Math.round(red * amount)}, ${Math.round(green * amount)}, ${Math.round(blue * amount)})`;
}

// 기존 가수 배너와 동일하게 이미지 오른쪽 가장자리의 대표색을 뽑아 배경 그라데이션으로 자연스럽게 잇는다.
function extractRightEdgePalette(image: HTMLImageElement): EdgePalette | null {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 64;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context || image.naturalWidth === 0 || image.naturalHeight === 0) return null;

    context.drawImage(image, image.naturalWidth * 0.88, image.naturalHeight * 0.08, image.naturalWidth * 0.1, image.naturalHeight * 0.72, 0, 0, canvas.width, canvas.height);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    const buckets = new Map<string, { count: number; red: number; green: number; blue: number }>();
    for (let index = 0; index < pixels.length; index += 4) {
      if (pixels[index + 3] < 128) continue;
      const key = `${pixels[index] >> 4}-${pixels[index + 1] >> 4}-${pixels[index + 2] >> 4}`;
      const bucket = buckets.get(key) ?? { count: 0, red: 0, green: 0, blue: 0 };
      bucket.count += 1;
      bucket.red += pixels[index];
      bucket.green += pixels[index + 1];
      bucket.blue += pixels[index + 2];
      buckets.set(key, bucket);
    }
    const dominant = [...buckets.values()].sort((a, b) => b.count - a.count)[0];
    if (!dominant) return null;
    const color = [dominant.red / dominant.count, dominant.green / dominant.count, dominant.blue / dominant.count];
    return { edge: darken(color, 1), middle: darken(color, 0.56), end: darken(color, 0.38) };
  } catch {
    return null;
  }
}

function TrackPromoBanner({ promo, onClick }: { promo: TrackPromo; onClick: () => void }) {
  const [imageFailed, setImageFailed] = useState(false);
  const [edgePalette, setEdgePalette] = useState<EdgePalette | null>(null);
  const hasImage = !imageFailed && !!promo.track.albumArtUrl;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${promo.track.title} - ${promo.track.artist} 보러 가기`}
      className="relative block aspect-[4/1] w-full overflow-hidden rounded-2xl bg-slate-900 text-left text-white active:scale-[0.99] transition-transform [container-type:inline-size]"
      data-testid={`track-promo-${promo.source}`}
    >
      <div
        className="absolute inset-0"
        style={{
          background: hasImage && edgePalette
            ? `linear-gradient(90deg, ${edgePalette.edge} 0%, ${edgePalette.edge} 38%, ${edgePalette.middle} 78%, ${edgePalette.end} 100%)`
            : 'linear-gradient(90deg, #9ca3af 0%, #4b5563 52%, #111827 100%)',
        }}
        aria-hidden="true"
      />
      <div className="relative flex h-full items-stretch">
        <div
          className="relative z-[6] aspect-square h-full shrink-0"
          style={hasImage ? {
            WebkitMaskImage: 'linear-gradient(90deg, #000 0%, #000 60%, rgba(0,0,0,.92) 70%, rgba(0,0,0,.68) 82%, rgba(0,0,0,.32) 92%, transparent 100%)',
            maskImage: 'linear-gradient(90deg, #000 0%, #000 60%, rgba(0,0,0,.92) 70%, rgba(0,0,0,.68) 82%, rgba(0,0,0,.32) 92%, transparent 100%)',
          } : undefined}
        >
          {hasImage ? (
            <img
              src={promo.track.albumArtUrl}
              crossOrigin="anonymous"
              alt=""
              className="h-full w-full object-cover"
              draggable={false}
              onLoad={(event: SyntheticEvent<HTMLImageElement>) => setEdgePalette(extractRightEdgePalette(event.currentTarget))}
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-white/10">
              <Music2 className="h-[34%] w-[34%] text-white/70" aria-hidden="true" />
            </div>
          )}
        </div>

        <div className="relative z-10 flex min-w-0 flex-1 flex-col items-start justify-center py-[2cqw] pl-[4cqw] pr-[3cqw] text-left text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.55)]">
          <p className="max-w-full truncate text-[clamp(11px,3.4cqw,17px)] font-extrabold leading-tight tracking-[-0.035em] text-white/90">{promo.message}</p>
          <p className="mt-[0.9cqw] max-w-full truncate text-[clamp(16px,5.2cqw,26px)] font-black leading-[1.05] tracking-[-0.05em]">{promo.track.title}</p>
          <p className="mt-[0.7cqw] max-w-full truncate text-[clamp(10px,3cqw,14px)] font-semibold leading-tight text-white/75">{promo.track.artist}</p>
        </div>
      </div>
    </button>
  );
}

export function TrackPromoCarousel({ recentSongs, popularTracks, weeklyTracks, isActive = true, onSelectRecent, onSelectChart }: TrackPromoCarouselProps) {
  // 선택 결과를 10분간 localStorage에 저장해 새로고침해도 같은 네 장을 유지한다.
  const [selection] = useState(() => getCachedSelection(recentSongs, popularTracks, weeklyTracks));
  const [firstRecent, secondRecent] = selection.recent;
  const { popular, weekly } = selection;

  const promos: TrackPromo[] = [
    ...(firstRecent ? [{
      source: 'recent' as const,
      track: firstRecent,
      recentSong: firstRecent,
      message: RECENT_MESSAGES[0],
    }] : []),
    ...(secondRecent ? [{
      source: 'recent' as const,
      track: secondRecent,
      recentSong: secondRecent,
      message: RECENT_MESSAGES[1],
    }] : []),
    ...(popular ? [{
      source: 'popular' as const,
      track: popular,
      chartTrack: popular,
      message: '지금 인기 있는 음악이에요',
    }] : []),
    ...(weekly ? [{
      source: 'weekly' as const,
      track: weekly,
      chartTrack: weekly,
      message: '이번 주 인기차트에 올랐어요',
    }] : []),
  ];

  const count = promos.length;
  const [current, setCurrent] = useState(0);
  const [transitionEnabled, setTransitionEnabled] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const axisRef = useRef<'h' | 'v' | null>(null);
  const swipedRef = useRef(false);
  const mouseStartXRef = useRef<number | null>(null);

  const slides = count > 1 ? [...promos, promos[0]] : promos;
  const goForward = () => {
    setTransitionEnabled(true);
    setCurrent((previous) => (previous >= count ? 1 : previous + 1));
  };
  const goBack = () => setCurrent((previous) => (previous - 1 + count) % count);
  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (count <= 1 || !isActive) return;
    timerRef.current = setInterval(goForward, AUTO_SLIDE_MS);
  };

  const finishSwipe = (delta: number) => {
    swipedRef.current = true;
    if (delta < 0) goForward();
    else goBack();
    resetTimer();
    setTimeout(() => { swipedRef.current = false; }, 0);
  };

  useEffect(() => {
    // 소식 탭 캐러셀과 동일하게 다른 탭에서 돌아오면 첫 장부터 다시 시작한다.
    if (isActive) setCurrent(0); // eslint-disable-line react-hooks/set-state-in-effect
    resetTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [count, isActive]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (count <= 1 || current !== count) return;
    const timer = setTimeout(() => {
      setTransitionEnabled(false);
      setCurrent(0);
    }, TRANSITION_MS);
    return () => clearTimeout(timer);
  }, [current, count]);

  useEffect(() => {
    if (transitionEnabled) return;
    let secondFrame = 0;
    const firstFrame = requestAnimationFrame(() => { secondFrame = requestAnimationFrame(() => setTransitionEnabled(true)); });
    return () => { cancelAnimationFrame(firstFrame); cancelAnimationFrame(secondFrame); };
  }, [transitionEnabled]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const onTouchStart = (event: TouchEvent) => {
      touchStartXRef.current = event.touches[0].clientX;
      touchStartYRef.current = event.touches[0].clientY;
      axisRef.current = null;
      swipedRef.current = false;
    };
    const onTouchMove = (event: TouchEvent) => {
      if (touchStartXRef.current === null) return;
      const dx = Math.abs(event.touches[0].clientX - touchStartXRef.current);
      const dy = Math.abs(event.touches[0].clientY - (touchStartYRef.current ?? 0));
      if (!axisRef.current) axisRef.current = dx > dy ? 'h' : 'v';
      if (axisRef.current === 'h') event.preventDefault();
    };
    const onTouchEnd = (event: TouchEvent) => {
      if (touchStartXRef.current === null) return;
      const delta = event.changedTouches[0].clientX - touchStartXRef.current;
      if (axisRef.current === 'h' && Math.abs(delta) > 40) finishSwipe(delta);
      touchStartXRef.current = null;
    };

    element.addEventListener('touchstart', onTouchStart, { passive: true });
    element.addEventListener('touchmove', onTouchMove, { passive: false });
    element.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      element.removeEventListener('touchstart', onTouchStart);
      element.removeEventListener('touchmove', onTouchMove);
      element.removeEventListener('touchend', onTouchEnd);
    };
  }, [count, isActive]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!count) {
    return null;
  }

  const selectPromo = (promo: TrackPromo) => {
    if (swipedRef.current) return;
    if (promo.source === 'recent' && promo.recentSong) onSelectRecent(promo.recentSong);
    if (promo.source === 'popular' && promo.chartTrack) onSelectChart(promo.chartTrack, 'popular');
    if (promo.source === 'weekly' && promo.chartTrack) onSelectChart(promo.chartTrack, 'weekly');
  };

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-2xl"
      onMouseDown={(event) => { mouseStartXRef.current = event.clientX; }}
      onMouseUp={(event) => {
        if (mouseStartXRef.current === null) return;
        const delta = event.clientX - mouseStartXRef.current;
        if (Math.abs(delta) > 40) finishSwipe(delta);
        mouseStartXRef.current = null;
      }}
    >
      <div className={`flex ${transitionEnabled ? 'transition-transform duration-300 ease-in-out' : ''}`} style={{ transform: `translateX(-${current * 100}%)` }}>
        {slides.map((promo, index) => (
          <div key={`${promo.source}-${promo.track.trackId}-${index === count ? 'clone' : index}`} className="w-full shrink-0">
            <TrackPromoBanner promo={promo} onClick={() => selectPromo(promo)} />
          </div>
        ))}
      </div>
      {count > 1 && (
        <div className="absolute bottom-1 right-3 z-20 flex items-center gap-1" aria-label={`${current % count + 1} / ${count}`}>
          {promos.map((promo, index) => (
            <button key={`${promo.source}-${promo.track.trackId}`} type="button" aria-label={`${index + 1}번째 배너로 이동`} className="py-1" onClick={() => { setTransitionEnabled(true); setCurrent(index); resetTimer(); }}>
              <span className={`block h-1 rounded-full transition-all ${index === current % count ? 'w-3.5 bg-white' : 'w-1 bg-white/45'}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
