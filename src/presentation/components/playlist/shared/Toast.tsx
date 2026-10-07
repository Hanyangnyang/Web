import type { CSSProperties } from 'react';
import { FAB_CLOSED_BOTTOM_PX, FAB_HEIGHT_PX, PLAYER_GAP_PX } from './AddSongFab';

interface ToastProps {
  message: string;
  // light: 배경을 더 연하게(반투명 + 블러) — 좋아요처럼 자주 뜨는 가벼운 피드백용
  variant?: 'default' | 'light';
  // true면 곡 추천하기 FAB과 세로 중심선을 맞춰서 띄움 — FAB은 플레이어가 열리면 그 위로 이동하므로
  // PlaylistView가 내려주는 --playlist-player-height(플레이어 실측 높이, 닫힘이면 0)를 읽어 같이 따라감.
  // 그래서 PlaylistView 안에서만 의미가 있음
  alignWithFab?: boolean;
}

// 높이를 고정해야 FAB 중심선에 맞출 수 있음 — index.css의 toastIn 애니메이션이 transform을 통째로 덮어써서
// translateY(-50%)로 보정하는 방식은 못 쓰고, bottom 값만으로 맞춤
const ALIGNED_TOAST_HEIGHT_PX = 32; // h-8
const ALIGNED_BOTTOM_OFFSET_PX = (FAB_HEIGHT_PX - ALIGNED_TOAST_HEIGHT_PX) / 2;

// FAB의 bottom(플레이어가 열려 있으면 그 위 + 간격, 닫혀 있으면 기본 위치 — AddSongFab와 같은 계산)에 오프셋을 더함
const ALIGNED_STYLE: CSSProperties = {
  bottom: `calc(max(var(--playlist-player-height, 0px) + ${PLAYER_GAP_PX}px, ${FAB_CLOSED_BOTTOM_PX}px) + ${ALIGNED_BOTTOM_OFFSET_PX}px + env(safe-area-inset-bottom))`,
};

// 화면 하단에 잠깐 떴다 사라지는 토스트 — 신고 접수 완료/링크 복사 완료 등 여러 화면이 공유하는 스타일
export function Toast({ message, variant = 'default', alignWithFab = false }: ToastProps) {
  const backgroundClass = variant === 'light' ? 'bg-[rgba(15,23,42,0.6)] backdrop-blur-md' : 'bg-[rgba(15,23,42,0.85)]';
  const layoutClass = alignWithFab ? 'h-8 px-4 flex items-center justify-center' : 'bottom-24 px-4 py-2';
  return (
    <div
      className={`fixed left-1/2 -translate-x-1/2 text-white text-[0.78rem] font-medium rounded-full z-[200] whitespace-pre-line text-center copy-toast pointer-events-none ${backgroundClass} ${layoutClass}`}
      style={alignWithFab ? ALIGNED_STYLE : undefined}
    >
      {message}
    </div>
  );
}
