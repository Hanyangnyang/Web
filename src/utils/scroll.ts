// 순수 DOM 유틸: 주어진 엘리먼트의 가장 가까운 스크롤 가능한 조상을 찾음(없으면 null)
export function findScrollableAncestor(el: Element | null): HTMLElement | null {
  let node: (Node & ParentNode) | null = el?.parentNode ?? null;
  while (node) {
    const style = window.getComputedStyle(node as Element);
    if (style.overflowY === 'auto' || style.overflowY === 'scroll') return node as HTMLElement;
    node = node.parentNode;
  }
  return null;
}

// 가장 가까운 스크롤 가능한 조상을 맨 위로 스크롤
export function scrollNearestScrollableAncestorToTop(el: Element | null): void {
  const scroller = findScrollableAncestor(el);
  if (scroller) scroller.scrollTop = 0;
}
