// 훅: 화면 스택(스크린스택의 각 프레임)마다 스크롤 위치를 독립적으로 기억했다가 복원 + 지정된 화면들의
// 체류시간을 PostHog(playlist_screen_dwell)로 캡처. PlaylistView가 "화면이 바뀔 때(useLayoutEffect)"와
// "언마운트될 때(unmount cleanup)" 양쪽에서 거의 같은 로직을 반복하고 있어 하나로 모음.
// PlaylistScreen 같은 구체 타입에 의존하지 않도록 제네릭으로 둬서, 호출부(PlaylistView)의 화면 타입을 그대로 씀
import { useEffect, useLayoutEffect, useRef } from 'react';
import { usePostHog } from 'posthog-js/react';

interface UseScreenDwellTrackingOptions<TScreen extends string> {
  screen: TScreen;
  // 이 화면들에 대해서만 체류시간을 캡처 — 나머지 화면은 스크롤 위치 복원만 함
  trackedScreens: readonly TScreen[];
  // dwell 이벤트에 함께 실어보낼 추가 속성(예: A/B 테스트 variant, view_mode) — 매 렌더 최신값을 그대로 넘기면 됨
  dwellProps?: Record<string, unknown>;
  // true인 동안은 스크롤 위치를 복원하지 않음 — 특정 카드 위치로 별도 스크롤(scrollIntoView 등)이 예정된 경우 씀
  skipScrollRestore?: boolean;
}

export function useScreenDwellTracking<TScreen extends string>({
  screen,
  trackedScreens,
  dwellProps,
  skipScrollRestore = false,
}: UseScreenDwellTrackingOptions<TScreen>) {
  const posthog = usePostHog();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollPositionsRef = useRef<Partial<Record<TScreen, number>>>({});
  const prevScreenRef = useRef<TScreen>(screen);
  const screenEnteredAtRef = useRef<number>(Date.now());
  // 언마운트 클린업은 마운트 시점의 클로저를 그대로 쓰기 때문에, 나가는 순간의 최신 화면/dwellProps를
  // 읽으려면 ref가 필요함(useLayoutEffect 쪽은 매 렌더 다시 실행되니 인자를 그대로 써도 최신값임)
  const currentScreenRef = useRef(screen);
  useEffect(() => { currentScreenRef.current = screen; }, [screen]);
  const dwellPropsRef = useRef(dwellProps);
  useEffect(() => { dwellPropsRef.current = dwellProps; }, [dwellProps]);

  useLayoutEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const prevScreen = prevScreenRef.current;
    if (prevScreen === screen) return;

    if (trackedScreens.includes(prevScreen)) {
      posthog?.capture('playlist_screen_dwell', {
        screen: prevScreen,
        duration_ms: Date.now() - screenEnteredAtRef.current,
        ...dwellProps,
      });
    }
    screenEnteredAtRef.current = Date.now();

    scrollPositionsRef.current[prevScreen] = container.scrollTop;
    if (!skipScrollRestore) {
      container.scrollTop = scrollPositionsRef.current[screen] ?? 0;
    }
    prevScreenRef.current = screen;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, skipScrollRestore]);

  // 뒤로가기로 플레이리스트 탭 자체를 나가는 경우(화면 전환 없이 바로 언마운트) — 위 효과는 화면이
  // "바뀔 때"만 캡처하므로, 나가는 순간의 체류시간은 언마운트 클린업에서 별도로 잡아야 함
  useEffect(() => {
    return () => {
      const exitScreen = currentScreenRef.current;
      if (trackedScreens.includes(exitScreen)) {
        posthog?.capture('playlist_screen_dwell', {
          screen: exitScreen,
          duration_ms: Date.now() - screenEnteredAtRef.current,
          exit: true,
          ...dwellPropsRef.current,
        });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { scrollContainerRef };
}
