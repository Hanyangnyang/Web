import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

// 처음 온 사람에게만, 잠깐 떴다 사라지는 말풍선(코치마크) — 그리드 보기 버튼과 곡 추천하기 FAB이 같은 모양을 쓰도록 공통화
// storageKey를 이미 본 기기에는 다시 안 뜨게 localStorage에 남긴다(캠퍼스맵 '뭐먹지' 코치마크와 동일한 방식)
const VISIBLE_MS = 3000;

type CoachmarkState = 'hidden' | 'visible' | 'leaving';

export function useCoachmark(storageKey: string, enabled = true) {
  const [state, setState] = useState<CoachmarkState>(() => {
    if (!enabled) return 'hidden';
    try {
      return localStorage.getItem(storageKey) ? 'hidden' : 'visible';
    } catch {
      // localStorage 접근 불가(시크릿 모드 등)면 매번 뜨는 것보다 안 뜨는 쪽이 덜 거슬림
      return 'hidden';
    }
  });

  useEffect(() => {
    if (state !== 'visible') return;
    try { localStorage.setItem(storageKey, '1'); } catch { /* 부가 안내라 저장 실패는 조용히 무시 */ }
    const t = setTimeout(() => setState('leaving'), VISIBLE_MS);
    return () => clearTimeout(t);
  }, [state, storageKey]);

  // enabled가 나중에 켜지는 경우(예: 검색 화면으로 먼저 들어왔다가 홈에 도착) — 그때 처음 보는 사람에게만 띄운다.
  // 떠 있는 중에 꺼지면(다른 화면으로 이동) 바로 사라지게 한다
  useEffect(() => {
    if (enabled && state === 'hidden') {
      try {
        if (!localStorage.getItem(storageKey)) setState('visible');
      } catch { /* 접근 불가면 안 띄움 */ }
    } else if (!enabled && state === 'visible') {
      setState('leaving');
    }
  }, [enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  const onAnimationEnd = () => { if (state === 'leaving') setState('hidden'); };

  // 어두운 화면을 터치하면 3초를 기다리지 않고 바로 페이드아웃 시작
  const dismiss = () => { if (state === 'visible') setState('leaving'); };

  return { state, onAnimationEnd, dismiss };
}

interface CoachmarkProps {
  state: CoachmarkState;
  onAnimationEnd: () => void;
  dismiss?: () => void; // 터치 차단막을 누르면 호출 — useCoachmark가 돌려주는 값을 그대로 펼쳐서 넘김
  children: ReactNode;
  // 말풍선이 놓일 위치(absolute/fixed + 좌표) — 호출하는 쪽이 정한다
  className?: string;
  style?: CSSProperties;
  // 꼬리가 말풍선 위(아래를 가리키는 버튼 아래에 놓일 때)인지 아래(위의 버튼을 가리킬 때)인지, 그리고 가로 위치
  tail?: 'top' | 'bottom';
  tailClassName?: string;
  // 말풍선이 sticky 헤더(z-100) 같은 요소 위에도 그려지도록 올려야 할 때 지정
  zClassName?: string;
  // false면 화면을 어둡게 덮지 않고(그림자 확산·터치 차단막 없음) 말풍선만 띄움 — 주변 버튼을 바로 눌러볼 수 있어야 하는 힌트용
  dim?: boolean;
  // 주면 말풍선 둘레 대신 이 영역(화면 기준 fixed 좌표)만 밝게 남기고 나머지를 어둡게 함 — 말풍선이 가리키는 버튼이 어두워지면 안 될 때
  spotlight?: { left: number; top: number; width: number; height: number };
}

export function Coachmark({ state, onAnimationEnd, dismiss, children, className = '', style, tail = 'top', tailClassName = 'right-3', zClassName = 'z-40', dim = true, spotlight }: CoachmarkProps) {
  if (state === 'hidden') return null;
  return (
    <div
      className={`${zClassName} w-max pointer-events-none ${state === 'visible' ? '[animation:fadeIn_0.3s_ease-out]' : '[animation:fadeOut_0.4s_ease-in_forwards]'} ${className}`}
      style={style}
      onAnimationEnd={onAnimationEnd}
      role="status"
    >
      {/* 어두워진 화면을 터치해도 아래 버튼·카드가 눌리지 않게 막는 투명 터치 차단막 — 어둡게 만드는 건 아래 말풍선의 그림자라 이 요소는 눈에 안 보임.
          말풍선이 backdrop-blur 헤더(sticky) 안에 있으면 그 안의 position:fixed는 화면이 아니라 헤더 기준이 돼서 헤더만 막고 나머지는 못 막았음 →
          document.body로 포털을 띄워 항상 화면 전체를 덮음(z는 플레이리스트 루트 z-[1001]보다 위). 말풍선이 사라지면(state hidden → return null) 같이 사라짐 */}
      {dim && createPortal(<div className="fixed inset-0 z-[1100] pointer-events-auto touch-none" onPointerDown={dismiss} aria-hidden="true" />, document.body)}
      {/* 모양·색은 캠퍼스맵 '뭐먹지' 말풍선과 동일. 두 번째 그림자(100vmax 확산)가 말풍선 둘레 화면 전체를 어둡게 덮어 시선이 말풍선으로 가게 한다 —
          별도 오버레이가 아니라 말풍선 자신의 그림자라 말풍선 위치·페이드와 항상 함께 움직이고 클릭도 막지 않는다 */}
      {/* 스포트라이트: 투명한 구멍 모양 요소의 그림자 확산이 구멍을 뺀 화면 전체를 어둡게 덮음. 말풍선(relative)이 DOM상 뒤라 이 위에 그려짐 */}
      {dim && spotlight && (
        <div
          aria-hidden="true"
          className="fixed rounded-full pointer-events-none shadow-[0_0_0_100vmax_rgba(0,0,0,0.4)]"
          style={{ left: spotlight.left, top: spotlight.top, width: spotlight.width, height: spotlight.height }}
        />
      )}
      <div className={`relative whitespace-nowrap bg-gradient-to-br from-amber-300 to-orange-400 text-[#5b3a00] text-[13.5px] font-extrabold leading-snug px-3.5 py-2.5 rounded-2xl ${dim && !spotlight ? 'shadow-[0_6px_18px_rgba(217,119,6,0.35),0_0_0_100vmax_rgba(0,0,0,0.4)]' : 'shadow-[0_6px_18px_rgba(217,119,6,0.35)]'}`}>
        {children}
        <span className={`absolute ${tail === 'top' ? '-top-1.5' : '-bottom-1.5'} ${tailClassName} w-3 h-3 bg-orange-400 rotate-45 rounded-[2px]`} />
      </div>
    </div>
  );
}
