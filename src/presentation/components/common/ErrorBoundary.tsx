// 렌더링 중 터진 예외를 잡아 그 영역만 대체 UI로 바꾼다.
// 이 경계가 없으면 React는 트리 전체를 버리기 때문에, 카드 하나가 터져도 앱 화면이 통째로 하얘진다.
//
// 잡는 것   : 자식 컴포넌트의 렌더/라이프사이클 중 예외
// 못 잡는 것: 이벤트 핸들러·비동기 콜백의 예외 (그건 전역 핸들러가 Sentry로 보낸다)
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { initSentry } from '../../../lib/sentry.js';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;  // 생략하면 아무것도 그리지 않는다 (없어도 되는 영역용)
  name?: string;         // Sentry에서 어느 경계가 터졌는지 구분하는 이름
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  // 렌더 단계에서 호출된다 — 화면을 대체 UI로 바꾸는 일만 한다
  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  // 커밋 단계에서 호출된다 — 보고 같은 부수효과는 여기서 한다
  componentDidCatch(error: Error, info: ErrorInfo) {
    initSentry().then(Sentry => {
      Sentry.captureException(error, {
        tags: { boundary: this.props.name ?? 'unnamed' },
        extra: { componentStack: info.componentStack },
      });
    });
  }

  render() {
    if (this.state.hasError) return this.props.fallback ?? null;
    return this.props.children;
  }
}
