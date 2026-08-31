import { getPlatform } from './platform.js';

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
