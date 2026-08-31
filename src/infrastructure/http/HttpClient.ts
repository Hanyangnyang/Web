// 플랫폼 독립적인 HTTP 클라이언트: DataSource가 fetch를 직접 호출하지 않고
// 이 클라이언트를 통해서만 호출하게 해서 에러 처리·baseURL 설정을 한 곳에 모은다
export interface HttpClient {
  get: (path: string, headers?: Record<string, string>) => Promise<Response>;
  post: (path: string, body: unknown, headers?: Record<string, string>) => Promise<Response>;
}

export interface HttpError extends Error {
  statusCode?: number;
  code?: string;
  endpoint?: string;
}

// 새 백엔드 공용 응답 포맷. success:false일 때의 처리(어떤 에러를 던질지)는
// HTTP 상태와 무관한 비즈니스 로직이라 Repository 계층에서 판단한다
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: { code: string; message: string };
  _requestUrl?: string; // 실제로 요청이 나간 최종 주소(res.url) — Repository가 Sentry용 apiError에 실어 보내는 용도
}

export const parseOrThrow = async (res: Response) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error?.message || data.message || `HTTP ${res.status}`) as HttpError;
    err.statusCode = res.status;
    if (data.error?.code) err.code = data.error.code;
    err.endpoint = res.url;
    throw err;
  }
  // 정적 JSON(교내건물·흡연장 등)은 배열을 그대로 반환한다 — 스프레드하면 배열이 아닌
  // 숫자 키 객체가 돼 뒤에서 .map()/.filter()가 깨진다. _requestUrl은 {success,data,error}
  // 백엔드 응답 봉투에서만 의미가 있으므로 배열이면 그대로 돌려준다.
  if (Array.isArray(data)) return data;
  return { ...data, _requestUrl: res.url };
};

// Repository가 검증 실패(success:false, shape 이상 등)로 직접 던지는 에러에
// Sentry 태그용 메타데이터(area/endpoint)를 일관된 방식으로 실어주는 헬퍼
export interface ApiValidationError extends Error {
  area?: string;
  endpoint?: string;
}

export function apiError(message: string, opts: { area?: string; endpoint?: string } = {}): ApiValidationError {
  const err = new Error(message) as ApiValidationError;
  err.area = opts.area;
  err.endpoint = opts.endpoint;
  return err;
}

// Repository 메서드 전체를 감싸는 헬퍼 — apiError로 직접 던지는 검증 실패뿐 아니라, parseOrThrow가
// 던지는 순수 HTTP 실패(4xx/5xx)나 fetch 자체가 실패하는 네트워크 에러까지 이 API의 area가 붙게 한다.
// 이미 area가 있는 에러(apiError로 이미 태깅됨)는 덮어쓰지 않는다.
export async function withAreaTag<T>(area: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    const err = e as ApiValidationError;
    if (err && typeof err === 'object' && !err.area) err.area = area;
    throw e;
  }
}

export const createHttpClient = ({ baseUrl = '' }: { baseUrl?: string } = {}): HttpClient => {
  const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
  const buildUrl = (path: string) => {
    if (!cleanBaseUrl) return path;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${cleanBaseUrl}${cleanPath}`;
  };

  return {
    get: (path, headers = {}) =>
      fetch(buildUrl(path), { headers }),

    post: (path, body, headers = {}) =>
      fetch(buildUrl(path), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(body),
      }),
  };
};
