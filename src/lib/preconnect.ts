// 곧 쓸 외부 출처의 DNS/TCP/TLS 연결을 탭 진입 시점에 미리 연다
// index.html에 고정으로 두면 앱 시작 직후 열렸다가 실제로 쓰기 전에 유휴 시간 초과로 닫혀 버려지는 경우가 많아서 옮김

function preconnect(origin: string, crossOrigin: boolean) {
  // 같은 출처의 link를 지우고 새로 넣어야 브라우저가 힌트를 다시 처리한다 — 탭에 다시 들어올 때마다 다시 건다
  // (연결이 아직 살아 있으면 브라우저가 그대로 재사용하므로 중복 연결은 생기지 않음)
  document.head.querySelector(`link[rel="preconnect"][href="${origin}"]`)?.remove();
  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = origin;
  if (crossOrigin) link.crossOrigin = 'anonymous';
  document.head.appendChild(link);
}

// 앨범커버·아티스트 이미지(i.scdn.co)는 <img crossOrigin="anonymous">로 요청해 CORS 연결 풀을 쓰므로 crossorigin을 맞춰야 재사용된다
export function preconnectSpotifyImages() {
  preconnect('https://i.scdn.co', true);
}
