import { Music2 } from 'lucide-react';
import { usePopularityChart } from '../../hooks/playlist/usePopularityChart.js';
import { ChartSongRow } from '../playlist/chart/ChartSongRow.js';
import { SongRowSkeleton } from '../playlist/shared/SongRowSkeleton.js';

interface PortalChartPromoCardProps {
  isActive?: boolean;
  // 카드를 탭했을 때 플레이리스트 탭(인기차트)으로 이동시키기 위해 씀
  onNavigate: () => void;
}

// 소식탭 캐러셀의 첫 슬라이드 — 헤더(홍보 문구) 아래에 인기차트 상위 3곡을, 인기차트 전체보기(ChartView)와
// 같은 줄 목록 카드(ChartSongRow)로 보여준다. 여기선 재생/게시글 보기 같은 개별 곡 인터랙션이 아니라
// 줄 어디를 눌러도 플레이리스트 탭으로 이동만 시키면 되므로, onPlay/onShowPosts 둘 다 onNavigate로 묶어서 넘긴다
// (공유 버튼은 ChartSongRow 자체 기능이라 그대로 둠 — 재생과 달리 탭 이동 없이도 바로 동작 가능)
export function PortalChartPromoCard({ isActive = true, onNavigate }: PortalChartPromoCardProps) {
  const { data: chart, isLoading } = usePopularityChart('popular', isActive);
  const topTracks = chart?.tracks.slice(0, 3) ?? [];

  return (
    <div className="w-full h-full rounded-card flex flex-col bg-white border border-slate-200/90 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.06)] overflow-hidden">
      <button type="button" onClick={onNavigate} className="text-left flex flex-col gap-1.5 flex-shrink-0 px-3 pt-3 pb-2">
        <span className="text-xs font-semibold">
          <span className="inline-flex items-center gap-0.5 text-playlist-primary">
            에리카 플레이리스트
            <Music2 size={12} strokeWidth={2.5} />
          </span>
          <span className="text-text-sub">에 너만 아는 띵곡 추천하러 가자!</span>
        </span>
        <span className="text-lg font-black text-text-main">🔥 실시간 인기차트</span>
      </button>

      {isLoading ? (
        <div className="flex-1 min-h-0 flex flex-col px-2 scale-90">
          <div className="flex-shrink-0 flex items-center gap-3 px-3 pb-1 text-[11px] font-semibold text-text-hint">
            <span className="w-7 text-center">순위</span>
            <div className="flex-1">곡정보</div>
            <div className="flex items-center gap-3">
              <span className="w-9 text-center">듣기</span>
              <span className="w-9 text-center">공유</span>
            </div>
          </div>
          <div className="flex-shrink-0 border-t border-slate-100" aria-hidden="true" />
          <div className="flex-1 min-h-0 flex flex-col justify-evenly">
            {[1, 2, 3].map((i) => (
              <SongRowSkeleton
                key={i}
                className="border-b border-slate-100 last:border-b-0"
                leading={<div className="w-7 h-4 rounded-full skeleton-shimmer flex-shrink-0" />}
                trailing={<div className="w-9 h-9 rounded-full skeleton-shimmer flex-shrink-0" />}
                thumbnailClassName="w-14 h-14"
              />
            ))}
          </div>
        </div>
      ) : topTracks.length > 0 ? (
        <div className="flex-1 min-h-0 flex flex-col px-2 scale-90">
          <div className="flex-shrink-0 flex items-center gap-3 px-3 pb-1 text-[11px] font-semibold text-black/70">
            <span className="w-7 text-center">순위</span>
            <div className="flex-1">곡정보</div>
            <div className="flex items-center gap-3">
              <span className="w-9 text-center">듣기</span>
              <span className="w-9 text-center">공유</span>
            </div>
          </div>
          <div className="flex-shrink-0 border-t border-slate-100" aria-hidden="true" />
          <div className="flex-1 min-h-0 flex flex-col justify-evenly">
            {topTracks.map((track) => (
              <ChartSongRow
                key={track.trackId}
                track={track}
                onPlay={onNavigate}
                onShowPosts={onNavigate}
                rankClassName="font-black text-xl text-gray-900 italic -skew-x-6"
                thumbnailClassName="w-14 h-14"
              />
            ))}
          </div>
        </div>
      ) : (
        <span className="text-sm font-semibold text-text-sub px-3 pb-3">인기차트 보러가기</span>
      )}
    </div>
  );
}
