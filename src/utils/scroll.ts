// 순수 DOM 유틸: 주어진 엘리먼트의 가장 가까운 스크롤 가능한 조상을 찾아 맨 위로 스크롤
export function scrollNearestScrollableAncestorToTop(el: Element | null): void {
  let node: (Node & ParentNode) | null = el?.parentNode ?? null;
  while (node) {
    const style = window.getComputedStyle(node as Element);
    if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
      (node as HTMLElement).scrollTop = 0;
      return;
    }
    node = node.parentNode;
  }
}
