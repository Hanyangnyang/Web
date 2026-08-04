// 컴포넌트: React.lazy 청크 로딩 중 보여주는 shimmer 스켈레톤 (BannerCarousel/WeatherCard의 스켈레톤과 같은 스타일)
interface SuspenseFallbackProps {
  minHeight?: number;
}

export function SuspenseFallback({ minHeight = 240 }: SuspenseFallbackProps) {
  return (
    <div
      className="rounded-card bg-gradient-to-br from-slate-100 to-slate-200/70 animate-pulse"
      style={{ minHeight }}
    />
  );
}
