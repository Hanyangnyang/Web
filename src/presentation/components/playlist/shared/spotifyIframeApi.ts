// Spotify IFrame API: 단순 <iframe src> 방식은 브라우저 자동재생 정책에 걸려
// 곡을 열어도 소리가 바로 안 나올 수 있음. 이 API로 controller.play()를 직접 호출하면
// 사용자 클릭에 이어지는 재생으로 인식되어 자동재생이 훨씬 안정적으로 동작한다.
declare global {
  interface Window {
    onSpotifyIframeApiReady?: (IFrameAPI: SpotifyIframeApi) => void;
  }
}

export interface SpotifyEmbedController {
  play: () => void;
  pause: () => void;
  resume: () => void;
  togglePlay: () => void;
  loadUri: (uri: string) => void;
  addListener: (event: string, callback: (e: any) => void) => void;
  removeListener: (event: string, callback?: (e: any) => void) => void;
  destroy: () => void;
}

export interface SpotifyIframeApi {
  createController: (
    element: HTMLElement,
    options: { uri: string; width?: string | number; height?: string | number },
    callback: (controller: SpotifyEmbedController) => void
  ) => void;
}

const SCRIPT_SRC = 'https://open.spotify.com/embed/iframe-api/v1';
let apiPromise: Promise<SpotifyIframeApi> | null = null;

export function loadSpotifyIframeApi(): Promise<SpotifyIframeApi> {
  if (apiPromise) return apiPromise;

  apiPromise = new Promise((resolve, reject) => {
    const previousCallback = window.onSpotifyIframeApiReady;
    window.onSpotifyIframeApiReady = (IFrameAPI) => {
      previousCallback?.(IFrameAPI);
      resolve(IFrameAPI);
    };

    if (!document.querySelector(`script[src="${SCRIPT_SRC}"]`)) {
      const script = document.createElement('script');
      script.src = SCRIPT_SRC;
      script.async = true;
      // 스크립트를 못 받으면 onSpotifyIframeApiReady가 영영 안 불려 Promise가 pending으로 남고, 싱글턴이라
      // 새로고침 전까지 재생이 안 됐다 → 실패 시 reject하고 캐시·태그를 비워 다음 호출(다음 재생)에서 다시 받게 함
      script.onerror = () => {
        apiPromise = null;
        script.remove();
        reject(new Error('Spotify IFrame API 스크립트 로드 실패'));
      };
      document.body.appendChild(script);
    }
  });

  return apiPromise;
}
