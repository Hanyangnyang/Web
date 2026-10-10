import { useLayoutEffect, useRef, useState, type CSSProperties, type SyntheticEvent } from 'react';
import { getArtistNameSize, pickArtistPromoTemplate, type ArtistPromoTemplate } from './artistPromoTypography.js';

export interface ArtistPromoBannerProps {
  artistName: string;
  artistImageUrl: string | null;
  onClick?: () => void;
  className?: string;
  // 지정하면 이 문구를 쓰고, 없으면 마운트 때 무작위로 고른다(캐러셀 복제 슬라이드와 문구를 맞추려고 씀)
  template?: ArtistPromoTemplate;
  // 높이를 절반(4:1)으로 줄인 버전 — 플레이리스트 홈의 인기차트 위에 쓴다. 로고와 '바로가기' 버튼은 빼고 글씨는 비례해서 줄인다
  compact?: boolean;
}

interface EdgePalette {
  edge: string;
  middle: string;
  end: string;
}

// 컴팩트 배너(높이 절반)에서 가수명·문구 글씨에 곱하는 비율
const COMPACT_TEXT_SCALE = 0.7;

// 오른쪽 끝 1.6em 구간에서 투명해지는 마스크 — 말줄임표(…) 대신 글자가 배경으로 스며들듯 사라지게 한다
const NAME_FADE_MASK = 'linear-gradient(90deg, #000 calc(100% - 1.6em), transparent 100%)';

// 가수명이 한 줄 영역을 넘칠 때만 오른쪽 끝을 페이드로 가린다(넘치지 않는 이름은 끝 글자가 흐려지면 안 되므로 측정 후 적용)
function FadingArtistName({ name, compact }: { name: string; compact: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [isClipped, setIsClipped] = useState(false);
  const fontSize = getArtistNameSize(name, compact ? COMPACT_TEXT_SCALE : 1);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => setIsClipped(element.scrollWidth > element.clientWidth + 1);
    measure();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    observer?.observe(element);
    // 웹폰트가 늦게 로드되면 글자 폭이 바뀌므로 로드 완료 후 다시 잰다
    document.fonts?.ready.then(measure);
    return () => observer?.disconnect();
  }, [name, fontSize]);

  return (
    <span
      ref={ref}
      className="block max-w-full overflow-hidden whitespace-nowrap"
      style={{
        fontSize,
        ...(isClipped ? { maskImage: NAME_FADE_MASK, WebkitMaskImage: NAME_FADE_MASK } : null),
      } as CSSProperties}
      data-clipped={isClipped}
      title={name}
    >
      {name}
    </span>
  );
}

function ArtistPromoCopy({ artistName, template, compact }: { artistName: string; template: ArtistPromoTemplate; compact: boolean }) {
  const artist = <FadingArtistName name={artistName.trim()} compact={compact} />;
  const lineClass = `block max-w-full ${compact ? 'text-[clamp(14px,4.6cqw,23px)]' : 'text-[clamp(20px,6.6cqw,33px)]'}`;

  return (
    <p className="min-w-0 max-w-full font-black leading-[1.06] tracking-[-0.05em] drop-shadow-[0_2px_8px_rgba(0,0,0,0.55)]">
      {template === 'listen-together' && <><span className="block max-w-full">{artist}</span><span className={lineClass}>같이 들어요</span></>}
      {template === 'do-you-like' && <><span className="block max-w-full">{artist}</span><span className={lineClass}>좋아하세요?</span></>}
      {template === 'how-about' && <><span className="block max-w-full">{artist}</span><span className={lineClass}>어때요?</span></>}
      {template === 'give-it-a-listen' && <><span className="block max-w-full">{artist}</span><span className={lineClass}>들어보세요</span></>}
      {template === 'want-to-listen' && <><span className="block max-w-full">{artist}</span><span className={lineClass}>들어볼래요?</span></>}
    </p>
  );
}

function darken([red, green, blue]: number[], amount: number): string {
  return `rgb(${Math.round(red * amount)}, ${Math.round(green * amount)}, ${Math.round(blue * amount)})`;
}

function extractRightEdgePalette(image: HTMLImageElement): EdgePalette | null {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 64;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context || image.naturalWidth === 0 || image.naturalHeight === 0) return null;

    // 테두리의 워터마크·압축 노이즈는 피하고, 사진 오른쪽 여백의 대표색을 작은 표본으로 뽑는다.
    context.drawImage(
      image,
      image.naturalWidth * 0.88,
      image.naturalHeight * 0.08,
      image.naturalWidth * 0.1,
      image.naturalHeight * 0.72,
      0,
      0,
      canvas.width,
      canvas.height,
    );

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

    return {
      edge: darken(color, 1),
      middle: darken(color, 0.56),
      end: darken(color, 0.38),
    };
  } catch {
    // CDN이 CORS 픽셀 읽기를 막는 경우에도 배너 자체는 정상 노출한다.
    return null;
  }
}

/**
 * 백엔드가 내려준 가수 이미지와 이름을 학술정보관 카드와 비슷한 2:1 비율로 조합한다.
 * 원본 이미지를 흐린 배경으로 한 번 더 사용하므로 별도의 색상 추출 없이도 톤이 자연스럽게 이어진다.
 */
export function ArtistPromoBanner({
  artistName,
  artistImageUrl,
  onClick,
  className = '',
  template,
  compact = false,
}: ArtistPromoBannerProps) {
  const [loadFailed, setImageFailed] = useState(false);
  // 이미지 URL 자체가 없으면 로드 실패와 같은 기본 이미지로 처리
  const imageFailed = loadFailed || !artistImageUrl;
  const [edgePalette, setEdgePalette] = useState<EdgePalette | null>(null);
  const [randomTemplate] = useState<ArtistPromoTemplate>(() => pickArtistPromoTemplate());
  const safeArtistName = artistName.trim() || '이 아티스트';
  const Wrapper = onClick ? 'button' : 'div';
  const wrapperProps = onClick
    ? { type: 'button' as const, onClick, 'aria-label': `${safeArtistName} 음악 보러 가기` }
    : {};

  return (
    <Wrapper
      {...wrapperProps}
      className={`relative block w-full select-none ${compact ? 'aspect-[4/1]' : 'aspect-[2/1]'} overflow-hidden rounded-2xl bg-slate-900 text-left [container-type:inline-size] ${onClick ? 'cursor-pointer active:scale-[0.99] transition-transform' : ''} ${className}`}
      data-testid="artist-promo-banner"
    >
      <div
        className="absolute inset-0"
        style={{
          background: imageFailed
            ? 'linear-gradient(115deg, #334155 0%, #111827 48%, #020617 100%)'
            : edgePalette
              ? `linear-gradient(90deg, ${edgePalette.edge} 0%, ${edgePalette.edge} 38%, ${edgePalette.middle} 78%, ${edgePalette.end} 100%)`
              : 'linear-gradient(90deg, #9ca3af 0%, #4b5563 52%, #111827 100%)',
        }}
        aria-hidden="true"
      />

      <div className="absolute inset-0 flex">
        <div
          className="relative z-[6] h-full aspect-square shrink-0"
          style={!imageFailed ? {
            WebkitMaskImage: 'linear-gradient(90deg, #000 0%, #000 60%, rgba(0,0,0,.92) 70%, rgba(0,0,0,.68) 82%, rgba(0,0,0,.32) 92%, transparent 100%)',
            maskImage: 'linear-gradient(90deg, #000 0%, #000 60%, rgba(0,0,0,.92) 70%, rgba(0,0,0,.68) 82%, rgba(0,0,0,.32) 92%, transparent 100%)',
          } : undefined}
        >
          {!imageFailed ? (
            <img
              src={artistImageUrl ?? undefined}
              crossOrigin="anonymous"
              alt={`${safeArtistName} 아티스트 이미지`}
              className="h-full w-full object-cover select-none"
              draggable={false}
              onLoad={(event: SyntheticEvent<HTMLImageElement>) => {
                setEdgePalette(extractRightEdgePalette(event.currentTarget));
              }}
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-white/10 text-[clamp(28px,12cqw,64px)] font-black text-white/80">
              {Array.from(safeArtistName)[0]}
            </div>
          )}
        </div>

        <div className="relative z-10 flex min-w-0 flex-1 flex-col items-start justify-center py-[2cqw] pl-[4cqw] pr-[2cqw] text-left text-white">
          <ArtistPromoCopy artistName={safeArtistName} template={template ?? randomTemplate} compact={compact} />
          {/* 추천 문구 아래 이동 안내 — 클릭은 배너 전체가 받으므로 장식용 */}
          {!compact && <span className="pointer-events-none mt-[1.6cqw] inline-flex max-w-full items-center gap-[0.8cqw] self-start whitespace-nowrap rounded-full border border-white/25 bg-black/25 px-[2.4cqw] py-[1cqw] text-[clamp(8px,2.5cqw,12px)] font-bold leading-none tracking-[-0.02em] text-white/90 shadow-[0_4px_14px_rgba(0,0,0,0.18)] backdrop-blur-md">
            에리카 플레이리스트 바로가기
            <svg viewBox="7 3 11 18" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-[1.1em] w-[0.67em] shrink-0">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </span>}
        </div>

        {/* 왼쪽 상단 하냥냥 로고(글자+발자국 PNG) — 배너 폭에 맞춰 같이 커지고 작아짐 */}
        {!compact && <img
          src="/assets/brand/hanyangnyang_logo.png"
          alt="하냥냥"
          className="pointer-events-none absolute left-[3cqw] top-[3cqw] z-20 h-[clamp(18px,5cqw,28px)] w-auto drop-shadow-[0_1px_4px_rgba(0,0,0,0.35)]"
          draggable={false}
        />}
      </div>
    </Wrapper>
  );
}
