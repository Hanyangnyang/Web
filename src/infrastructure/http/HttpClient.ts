// 플랫폼 독립적인 HTTP 클라이언트: DataSource가 fetch를 직접 호출하지 않고
// 이 클라이언트를 통해서만 호출하게 해서 에러 처리·baseURL 설정을 한 곳에 모은다
export interface HttpClient {
  get: (path: string, headers?: Record<string, string>) => Promise<Response>;
  post: (path: string, body: unknown, headers?: Record<string, string>) => Promise<Response>;
}

export interface HttpError extends Error {
  statusCode?: number;
  code?: string;
}

// 새 백엔드 공용 응답 포맷. success:false일 때의 처리(어떤 에러를 던질지)는
// HTTP 상태와 무관한 비즈니스 로직이라 Repository 계층에서 판단한다
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: { code: string; message: string };
}

export const parseOrThrow = async (res: Response) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error?.message || data.message || `HTTP ${res.status}`) as HttpError;
    err.statusCode = res.status;
    if (data.error?.code) err.code = data.error.code;
    throw err;
  }
  return data;
};

export const createHttpClient = ({ baseUrl = '' }: { baseUrl?: string } = {}): HttpClient => ({
  get: (path, headers = {}) =>
    fetch(`${baseUrl}${path}`, { headers }),

  post: (path, body, headers = {}) =>
    fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
    }),
});
