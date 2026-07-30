import { getPlatform } from './platform.js';

declare global {
  interface Window {
    __androidBackPress?: () => boolean;
  }
}

type BackHandlerFn = () => void;

const handlerStack: BackHandlerFn[] = [];

export const pushBackHandler = (fn: BackHandlerFn) => handlerStack.push(fn);
export const popBackHandler = () => handlerStack.pop();

// MainActivity.java의 OnBackPressedCallback이 이 함수를 호출
// true 반환 → Java가 아무것도 안 함 (JS가 처리)
// false 반환 → Java가 finish()로 앱 종료
if (getPlatform() === 'android') {
  window.__androidBackPress = () => {
    if (handlerStack.length > 0) {
      handlerStack[handlerStack.length - 1]();
      return true;
    }
    return false;
  };
}
