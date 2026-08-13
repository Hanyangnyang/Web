// 훅: 현재 시각(epoch ms)을 "구독"한다.
//
// 렌더 함수는 순수해야 한다 — 같은 입력이면 늘 같은 결과여야 하고, React가 몇 번을 호출하든
// 동일해야 한다. 그런데 Date.now()는 부를 때마다 값이 달라서, 렌더 도중(useMemo 포함)에 읽으면
// 그 규칙을 깬다. eslint의 react-hooks/purity가 잡아내는 게 정확히 이 경우다.
//
// 실제 피해도 있다. useMemo 안에서 읽으면 의존성이 바뀌기 전까지 재계산되지 않아서,
// 한 번 계산한 "오늘"이 자정을 넘겨도 어제로 굳어버린다.
//
// 그래서 시계를 'React 바깥에서 변하는 값'으로 취급하고 useSyncExternalStore로 구독한다.
// 구독자가 하나도 없으면 타이머도 멈추므로, 아무도 안 쓸 때는 비용이 0이다.
import { useSyncExternalStore } from 'react';

// 날짜 경계와 정각 판정에만 쓰이므로 분 단위면 충분하다
const TICK_MS = 60_000;

let snapshot = Date.now();
let timer: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<() => void>();

function subscribe(onStoreChange: () => void): () => void {
  // 구독이 끊겨 있던 동안 snapshot이 낡았을 수 있어, 재개 시점에 한 번 맞춘다
  snapshot = Date.now();
  listeners.add(onStoreChange);

  if (timer === null) {
    timer = setInterval(() => {
      snapshot = Date.now();
      listeners.forEach(listener => listener());
    }, TICK_MS);
  }

  return () => {
    listeners.delete(onStoreChange);
    if (listeners.size === 0 && timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  };
}

// 구독하지 않는 상태. 화면에 안 보이는 동안 헛도는 리렌더를 막는다.
// (탭을 벗어나도 컴포넌트는 display:none으로 살아있으므로 언마운트에 기댈 수 없다)
const subscribeNoop = () => () => {};

// 여기서 매번 Date.now()를 돌려주면 React가 "값이 계속 바뀐다"고 판단해 무한 렌더에 빠진다.
// 반드시 틱 때만 갱신되는 캐시값을 돌려줘야 한다.
const getSnapshot = () => snapshot;

// active=false면 시계를 구독하지 않고 마지막 값을 그대로 쓴다.
// 다시 true가 되면 subscribe()가 snapshot을 최신으로 맞추므로, 재진입 즉시 정확한 시각이 반영된다.
export function useNow(active = true): number {
  return useSyncExternalStore(active ? subscribe : subscribeNoop, getSnapshot, getSnapshot);
}
