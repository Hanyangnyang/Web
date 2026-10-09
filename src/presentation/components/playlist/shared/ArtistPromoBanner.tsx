import { useState, type CSSProperties, type SyntheticEvent } from 'react';
import { getArtistNameSize, pickArtistPromoTemplate, truncateArtistName, type ArtistPromoTemplate } from './artistPromoTypography.js';

export interface ArtistPromoBannerProps {
  artistName: string;
  artistImageUrl: string;
  onClick?: () => void;
  className?: string;
}

interface EdgePalette {
  edge: string;
  middle: string;
  end: string;
}

function ArtistPromoCopy({ artistName, template }: { artistName: string; template: ArtistPromoTemplate }) {
  const displayArtistName = truncateArtistName(artistName);
  const artist = (
    <span
      className="inline-block max-w-full truncate align-bottom"
      style={{ fontSize: getArtistNameSize(displayArtistName) } as CSSProperties}
      title={artistName}
    >
      {displayArtistName}
    </span>
  );
  const lineClass = 'block max-w-full text-[clamp(24px,7.8cqw,39px)]';

  return (
    <p className="min-w-0 max-w-full font-black leading-[1.06] tracking-[-0.05em] drop-shadow-[0_2px_8px_rgba(0,0,0,0.55)]">
      {template === 'listen-together' && <><span className="block max-w-full">{artist}</span><span className={lineClass}>같이 들어요</span></>}
      {template === 'do-you-like' && <><span className="block max-w-full">{artist}</span><span className={lineClass}>좋아하세요?</span></>}
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
}: ArtistPromoBannerProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const [edgePalette, setEdgePalette] = useState<EdgePalette | null>(null);
  const [copyTemplate] = useState<ArtistPromoTemplate>(() => pickArtistPromoTemplate());
  const safeArtistName = artistName.trim() || '이 아티스트';
  const Wrapper = onClick ? 'button' : 'div';
  const wrapperProps = onClick
    ? { type: 'button' as const, onClick, 'aria-label': `${safeArtistName} 음악 보러 가기` }
    : {};

  return (
    <Wrapper
      {...wrapperProps}
      className={`relative block w-full aspect-[2/1] overflow-hidden rounded-2xl bg-slate-900 text-left [container-type:inline-size] ${onClick ? 'cursor-pointer active:scale-[0.99] transition-transform' : ''} ${className}`}
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
              src={artistImageUrl}
              crossOrigin="anonymous"
              alt={`${safeArtistName} 아티스트 이미지`}
              className="h-full w-full object-cover"
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
          <ArtistPromoCopy artistName={safeArtistName} template={copyTemplate} />
        </div>

        <span className="pointer-events-none absolute bottom-[3cqw] right-[3cqw] z-20 rounded-full border border-white/25 bg-black/25 px-[3cqw] py-[1.2cqw] text-[clamp(8px,2.5cqw,12px)] font-bold tracking-[-0.02em] text-white/90 shadow-[0_4px_14px_rgba(0,0,0,0.18)] backdrop-blur-md">
          에리카 플레이리스트로 이동하기
        </span>
      </div>
    </Wrapper>
  );
}
