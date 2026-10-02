// 도메인 엔티티: 에리카 인기 음악 차트 (새 백엔드 /api/v1/playlist/songs/charts)
export interface ChartTrack {
  rank: number;
  trackId: string;
  title: string;
  artist: string;
  albumArtUrl: string;
}

export interface PopularityChart {
  chartType: string;
  // 서버가 만들어주는 사람이 읽기 좋은 제목 (예: "08.27 19:00 기준 실시간 급상승")
  displayTitle: string;
  tracks: ChartTrack[];
}

export function createPopularityChart(raw: PopularityChart): PopularityChart {
  return { ...raw };
}
