// 컴포넌트: 웹에서 카카오 지하철로 리다이렉트되는 동안 보여주는 전체화면 로딩 오버레이
interface SubwayRedirectOverlayProps {
  visible: boolean;
}

export function SubwayRedirectOverlay({ visible }: SubwayRedirectOverlayProps) {
  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 bg-[rgba(15,23,42,0.78)] backdrop-blur-[6px] z-[10000] flex flex-col justify-center items-center gap-4 text-center select-none"
      style={{ animation: 'sttFadeIn 0.25s ease-out' }}
    >
      <div className="w-12 h-12 border-[3.5px] border-white/10 rounded-full border-t-primary animate-[spin_0.8s_linear_infinite] mb-2" />
      <p className="text-white text-[1.05rem] font-bold tracking-tight leading-snug whitespace-pre-line">
        카카오 지하철로 이동할게요!
      </p>
      <p className="text-white/40 text-[0.78rem] font-medium tracking-wide">
        잠시만 기다려 주세요
      </p>
    </div>
  );
}
