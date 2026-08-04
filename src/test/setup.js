import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// 모든 테스트 파일에 공통 적용되는 정리 로직.
// 테스트 하나가 남긴 상태(마운트된 훅, localStorage)가 다음 테스트에 새어 들어가면
// "혼자 돌리면 통과, 전체 돌리면 실패"하는 순서 의존 테스트가 되므로 매번 초기화한다.
afterEach(() => {
  cleanup();            // renderHook/render로 마운트된 컴포넌트 언마운트
  localStorage.clear(); // jsdom의 localStorage 초기화
});
