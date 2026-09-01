interface EmptyChartStateProps {
  // '실시간'/'주간'/'월간' 등 지금 보고 있는 기간 칩의 라벨 — 아직 그 기간 차트가 집계되지 않았다는 문맥을 보여주는 데 씀
  periodLabel: string;
  // 차트가 비어도 최근 추가된 곡은 있을 가능성이 높아서(집계만 아직 안 된 것뿐), 그쪽으로 유도
  onShowRecent: () => void;
}

// 인기차트가 0개일 때 쓰는 안내 — "곡이 없다"가 아니라 "재생 집계가 아직 안 됐다"는 뜻이라,
// 곡추천하기 대신 실제로 곡이 있을 최근추가된곡 화면으로 유도
export function EmptyChartState({ periodLabel, onShowRecent }: EmptyChartStateProps) {
  return (
    <button
      onClick={onShowRecent}
      className="w-full flex flex-col items-center justify-center gap-1.5 py-10 px-4 text-center transition-colors active:scale-[0.98]"
    >
      <p className="text-[12px] font-semibold text-text-sub">아직 '{periodLabel}' 차트가 집계되지 않았어요</p>
      <span className="flex items-center gap-1 mt-1 px-3 py-1.5 rounded-full bg-white text-text-main border border-slate-200 shadow-sm text-xs font-bold">
        <span>🎵</span>
        최근 추가된 곡 보러가기
      </span>
    </button>
  );
}
