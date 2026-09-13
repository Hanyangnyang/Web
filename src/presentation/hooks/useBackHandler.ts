// 훅: 모달/시트가 열려있는 동안 안드로이드 하드웨어 뒤로가기를 가로채서 닫기 동작으로 연결
import { useEffect, useRef } from 'react';
import { pushBackHandler, popBackHandler } from '../../lib/androidBackHandler.js';

/**
 * @param onBack 뒤로가기를 눌렀을 때 실행할 동작. 매 렌더 새로 만들어져도 재등록하지 않는다.
 * @param enabled false면 아예 등록하지 않는다 — 닫을 게 없을 땐 뒤로가기를 가로채면 안 되기 때문.
 *   (가로채면 true를 돌려줘 안드로이드가 앱 종료·화면 이동을 못 한다)
 */
export function useBackHandler(onBack: () => void, enabled = true) {
  // 최신 콜백은 ref로 따라간다. onBack을 그대로 deps에 넣으면 상태가 바뀔 때마다
  // 해제→재등록이 일어나 스택 순서가 흔들린다.
  const latest = useRef(onBack);
  useEffect(() => {
    latest.current = onBack;
  });

  useEffect(() => {
    if (!enabled) return;
    const handler = () => latest.current();
    pushBackHandler(handler);
    return () => popBackHandler(handler);
  }, [enabled]);
}
