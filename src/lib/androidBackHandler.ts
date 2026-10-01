import { getPlatform, isAndroidWeb } from './platform.js';

declare global {
  interface Window {
    __androidBackPress?: () => boolean;
  }
}

type BackHandlerFn = () => void;

const handlerStack: BackHandlerFn[] = [];

export const pushBackHandler = (fn: BackHandlerFn) => handlerStack.push(fn);

// 자기 핸들러를 지목해서 빼낸다.
// 무조건 pop()하면 "맨 위"를 빼기 때문에, 등록 순서와 해제 순서가 어긋날 때
// 남의 핸들러를 대신 빼버린다 (예: 지도 시트가 열린 채로 다른 시트가 위에 뜬 경우).
export const popBackHandler = (fn?: BackHandlerFn): void => {
  if (!fn) {
    handlerStack.pop();
    return;
  }
  const index = handlerStack.lastIndexOf(fn);
  if (index !== -1) handlerStack.splice(index, 1);
};

const EXIT_CONFIRM_WINDOW_MS = 2000;
const BACK_GUARD_STATE = { hanyangnyangBackGuard: true };

let lastExitWarningAt = 0;
let exitWarningListener: (() => void) | null = null;

// 종료 경고 배너를 띄우는 쪽(React)이 구독한다.
export const onExitWarning = (fn: () => void) => {
  exitWarningListener = fn;
  return () => {
    if (exitWarningListener === fn) exitWarningListener = null;
  };
};

// 스택이 비어 더 이상 가로챌 게 없을 때의 뒤로가기.
// 첫 번째는 경고만 띄우고, EXIT_CONFIRM_WINDOW_MS 안의 두 번째에서만 종료를 허용한다.
const shouldExit = (): boolean => {
  const now = Date.now();
  if (now - lastExitWarningAt <= EXIT_CONFIRM_WINDOW_MS) return true;
  lastExitWarningAt = now;
  exitWarningListener?.();
  return false;
};

// MainActivity.java의 OnBackPressedCallback이 이 함수를 호출
// true 반환 → Java가 아무것도 안 함 (JS가 처리)
// false 반환 → Java가 finish()로 앱 종료
if (getPlatform() === 'android') {
  window.__androidBackPress = () => {
    if (handlerStack.length > 0) {
      handlerStack[handlerStack.length - 1]();
      return true;
    }
    return !shouldExit();
  };
}

// 안드로이드 웹(브라우저/PWA): 하드웨어 뒤로가기 이벤트가 없어 history 항목을 하나 더 쌓아 popstate로 가로챈다.
// 가드 항목 위에 있다가 뒤로가기 → 베이스 항목으로 내려오며 popstate 발생 → 가드를 다시 쌓아 앱에 머문다.
// 종료를 허용할 땐 가드를 다시 쌓지 않고 history.back()으로 베이스 항목마저 벗어난다.
if (isAndroidWeb()) {
  let armed = false;

  // Chrome은 사용자 조작 없이 쌓은 history 항목을 뒤로가기에서 건너뛰므로(history manipulation intervention),
  // 첫 터치 이후에 처음 쌓는다.
  const arm = () => {
    if (armed) return;
    history.pushState(BACK_GUARD_STATE, '');
    armed = true;
  };

  window.addEventListener('pointerdown', arm, { once: true, passive: true });

  window.addEventListener('popstate', () => {
    if (!armed) return;
    armed = false;

    if (handlerStack.length > 0) {
      handlerStack[handlerStack.length - 1]();
      arm();
      return;
    }
    if (shouldExit()) {
      history.back();
      return;
    }
    arm();
  });
}
