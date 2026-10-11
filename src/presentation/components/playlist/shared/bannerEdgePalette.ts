export interface EdgePalette {
  edge: string;
  middle: string;
  end: string;
}

function shade([red, green, blue]: number[], amount: number): string {
  return `rgb(${Math.round(red * amount)}, ${Math.round(green * amount)}, ${Math.round(blue * amount)})`;
}

// 앨범/아티스트 이미지 오른쪽 가장자리의 대표색으로 배너 배경 팔레트를 만든다.
export function extractRightEdgePalette(image: HTMLImageElement): EdgePalette | null {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 64;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context || image.naturalWidth === 0 || image.naturalHeight === 0) return null;

    // 테두리의 워터마크·압축 노이즈는 피하고, 사진 오른쪽 여백의 대표색을 작은 표본으로 뽑는다.
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

    return {
      edge: shade(color, 1),
      middle: shade(color, 0.56),
      end: shade(color, 0.38),
    };
  } catch {
    // CDN이 CORS 픽셀 읽기를 막는 경우에도 배너 자체는 정상 노출한다.
    return null;
  }
}

export function edgePaletteGradient({ edge, middle, end }: EdgePalette): string {
  return `linear-gradient(90deg, ${edge} 0%, ${edge} 38%, ${middle} 78%, ${end} 100%)`;
}
