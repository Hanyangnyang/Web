import { App } from '@capacitor/app';
import { getPlatform } from './platform.js';

const handlerStack = [];

export const pushBackHandler = (fn) => handlerStack.push(fn);
export const popBackHandler = () => handlerStack.pop();

// 모듈 로드 시 딱 한 번만 실행 (React lifecycle과 무관)
if (getPlatform() === 'android') {
  App.addListener('backButton', () => {
    if (handlerStack.length > 0) {
      handlerStack[handlerStack.length - 1]();
    } else {
      App.exitApp();
    }
  });
}
