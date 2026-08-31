// 지도를 못 띄우는 상황(로딩·실패)에 화면 전체를 대신 채우는 안내.
interface Props {
  emoji?: string;
  title: string;
  description?: string;
  pulse?: boolean; 
}

export function MapStatusScreen({ emoji, title, description, pulse }: Props) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-2 text-text-hint bg-slate-50">
      {/* 화면 전체를 차지하는 안내라 이모지를 크게 둔다. 로딩 중엔 문구와 함께 깜빡여야 한 덩어리로 읽힌다 */}
      {emoji && <span className={`text-4xl ${pulse ? 'animate-pulse' : ''}`}>{emoji}</span>}
      <p className={`text-sm font-bold ${pulse ? 'animate-pulse' : ''}`}>{title}</p>
      {description && <p className="text-xs">{description}</p>}
    </div>
  );
}
