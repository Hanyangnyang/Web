// 플레이리스트 테마: 장르별 칩 색상 (제휴탭 색상팔레트 차용)
export const PLAYLIST_COLORS = [
  { light: 'bg-[rgba(254,215,170,0.6)]', active: 'bg-[rgba(230,140,60,1)]' },       // 주황
  { light: 'bg-[rgba(254,202,202,0.6)]', active: 'bg-[rgba(239,68,68,1)]' },       // 빨강
  { light: 'bg-[rgba(229,231,235,0.6)]', active: 'bg-[rgba(107,114,128,1)]' },     // 회색
  { light: 'bg-[rgba(233,213,255,0.6)]', active: 'bg-[rgba(147,51,234,1)]' },      // 보라
  { light: 'bg-[rgba(187,247,208,0.6)]', active: 'bg-[rgba(34,197,94,1)]' },       // 초록
  { light: 'bg-[rgba(254,240,138,0.6)]', active: 'bg-[rgba(202,138,4,1)]' },       // 노랑
  { light: 'bg-[rgba(191,219,254,0.6)]', active: 'bg-[rgba(59,130,246,1)]' },      // 파랑
  { light: 'bg-[rgba(251,207,232,0.6)]', active: 'bg-[rgba(219,39,119,1)]' },      // 분홍
];

export function getGenreColor(colorIndex: number): string {
  if (colorIndex < 0 || colorIndex >= PLAYLIST_COLORS.length) return '';
  return PLAYLIST_COLORS[colorIndex].light;
}

export function getGenreActiveColor(colorIndex: number): string {
  if (colorIndex < 0 || colorIndex >= PLAYLIST_COLORS.length) return '';
  return PLAYLIST_COLORS[colorIndex].active;
}
