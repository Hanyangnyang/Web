// 플랫폼 독립적인 HTTP 클라이언트: DataSource가 fetch를 직접 호출하지 않고
// 이 클라이언트를 통해서만 호출하게 해서 에러 처리·baseURL 설정을 한 곳에 모은다
export interface HttpClient {
  get: (path: string, headers?: Record<string, string>) => Promise<Response>;
  post: (path: string, body: unknown, headers?: Record<string, string>) => Promise<Response>;
}

export interface HttpError extends Error {
  statusCode?: number;
}

export const parseOrThrow = async (res: Response) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || `HTTP ${res.status}`) as HttpError;
    err.statusCode = res.status;
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
