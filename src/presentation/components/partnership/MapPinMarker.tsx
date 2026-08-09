// 지도 위 마커 — 45도 회전한 사각형(원에 가까워 뚱뚱해 보였다) 대신,
// 동그란 머리 + 좁고 긴 꼬리(삼각형)로 만들어 훨씬 날렵한 실루엣을 낸다.
// 꼬리 끝이 정확히 실좌표를 가리키도록 xAnchor=0.5·yAnchor=1(바닥 중앙)로 붙인다.
// 색은 매장·건물·흡연장 모두 동일한 빨강으로 통일 (점 마커와도 같은 색이라 레이어 전환이 자연스럽다).
import { MARKER_COLOR } from './markerColors';

interface Props {
  selected: boolean;
  onClick: () => void;
  ariaLabel: string;
}

const HEAD_D = 14;
const HEAD_D_SELECTED = 18;
const TAIL_H = 12;
const TAIL_H_SELECTED = 15;
// 꼬리 폭 = 머리 지름의 이 비율 — 작을수록 더 뾰족하고 날렵해 보인다
const TAIL_WIDTH_RATIO = 0.42;

export function MapPinMarker({ selected, onClick, ariaLabel }: Props) {
  const headD = selected ? HEAD_D_SELECTED : HEAD_D;
  const tailH = selected ? TAIL_H_SELECTED : TAIL_H;
  const tailW = headD * TAIL_WIDTH_RATIO;
  const height = headD + tailH;

  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className="relative block p-0 border-0 bg-transparent [-webkit-tap-highlight-color:transparent] active:scale-95 transition-transform"
      style={{ width: headD, height }}
    >
      {/* 머리: 원 */}
      <span
        className="absolute top-0 left-0 block box-border rounded-full"
        style={{
          width: headD,
          height: headD,
          background: MARKER_COLOR,
          border: '1px solid rgba(0,0,0,0.15)',
          boxShadow: selected ? '0 3px 10px rgba(239,68,68,0.55)' : '0 2px 6px rgba(0,0,0,0.25)',
        }}
      />
      {/* 꼬리: CSS 삼각형(테두리 트릭) — 머리 바로 아래에서 시작해 한 점으로 좁아진다 */}
      <span
        className="absolute"
        style={{
          top: headD - 1,
          left: (headD - tailW) / 2,
          width: 0,
          height: 0,
          borderLeft: `${tailW / 2}px solid transparent`,
          borderRight: `${tailW / 2}px solid transparent`,
          borderTop: `${tailH}px solid ${MARKER_COLOR}`,
        }}
      />
    </button>
  );
}
