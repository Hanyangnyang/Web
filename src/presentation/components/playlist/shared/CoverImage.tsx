import { useState, type CSSProperties, type ImgHTMLAttributes } from 'react';
// 스플래시 하냥이(public/hanyang_splash.png, 186KB)를 256px WebP(11KB)로 줄여 ?inline으로 JS 번들에 data URI로 박아 넣는다.
// public 파일은 웹/개발 서버에서는 결국 네트워크로 받아오므로, 느린 망에서는 대체 이미지인 하냥이까지 위에서부터 조금씩 그려졌음
import coverFallbackSrc from '../../../../assets/playlist/cover-fallback-hanyang.webp?inline';

// 앨범커버·가수사진을 못 불러왔을 때 대신 보여줄 하냥이 — 번들에 들어 있어 추가 요청 없이 바로 뜬다
export const COVER_FALLBACK_SRC: string = coverFallbackSrc;

const FALLBACK_BACKGROUND = '#ffffff';

// 하냥이가 커버 칸을 꽉 채우면 잘려 보이므로 사방에 여백을 두고 가운데에 작게 얹는다
const FALLBACK_STYLE: CSSProperties = {
  objectFit: 'contain',
  padding: '14%',
  backgroundColor: FALLBACK_BACKGROUND,
};

// 로딩 중(아직 onLoad/onError 둘 다 안 옴)에는 같은 하냥이를 배경으로 깔아둔다 —
// 네트워크가 느려 에러도 안 나고 계속 대기하는 경우에도 빈 칸 대신 하냥이가 보이고, 불투명한 커버가 로드되면 그 위를 덮는다
const LOADING_STYLE: CSSProperties = {
  backgroundImage: `url(${COVER_FALLBACK_SRC})`,
  backgroundSize: '72%',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  backgroundColor: FALLBACK_BACKGROUND,
};

type CoverImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  src: string | null | undefined;
};

/**
 * 앨범커버·가수사진용 <img> — URL이 비었거나 로드에 실패하면 스플래시 하냥이로 대체한다.
 * 상태를 src와 묶어서 저장하므로 같은 컴포넌트에 다른 곡이 들어와도(무한 스크롤 재사용 등) 이전 곡의 실패 상태가 남지 않는다.
 */
export function CoverImage({ src, style, onLoad, onError, ...rest }: CoverImageProps) {
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showFallback = !src || failedSrc === src;
  const isLoading = !showFallback && loadedSrc !== src;

  if (showFallback) {
    return <img {...rest} src={COVER_FALLBACK_SRC} style={{ ...style, ...FALLBACK_STYLE }} data-cover-fallback="true" />;
  }

  return (
    <img
      {...rest}
      src={src}
      style={isLoading ? { ...style, ...LOADING_STYLE } : style}
      onLoad={(event) => {
        setLoadedSrc(src);
        onLoad?.(event);
      }}
      onError={(event) => {
        setFailedSrc(src);
        onError?.(event);
      }}
    />
  );
}
