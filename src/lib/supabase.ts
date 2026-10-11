import { createClient } from '@supabase/supabase-js';
import { hybridSecureStorage } from '../infrastructure/storage/SecureStorage.js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: hybridSecureStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false
  }
});

// Supabase Auth의 요청 한도(429)에 걸렸을 때 — 호출부가 "잠시 후 다시 시도" 안내를 띄울 수 있게 다른 에러와 구분
export class AuthRateLimitError extends Error {
  constructor() {
    super('Supabase auth request rate limit reached');
    this.name = 'AuthRateLimitError';
  }
}

// 한도에 걸린 직후엔 요청을 더 보내봐야 한도만 더 소진되므로, 이 시간 동안은 서버에 묻지 않고 바로 같은 에러를 던짐
const RATE_LIMIT_COOLDOWN_MS = 30 * 1000;
let rateLimitedUntil = 0;

// 진행 중인 세션 확보 요청 — 화면 진입 시 여러 훅이 동시에 호출해도 익명 로그인은 한 번만 나가도록 공유
let pendingUserId: Promise<string> | null = null;

async function resolveAnonymousUserId(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user?.id) return session.user.id;

  if (Date.now() < rateLimitedUntil) throw new AuthRateLimitError();

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) {
    if (error.status === 429) {
      rateLimitedUntil = Date.now() + RATE_LIMIT_COOLDOWN_MS;
      throw new AuthRateLimitError();
    }
    throw error;
  }
  if (!data.session) throw new Error('Anonymous sign-in returned no session');
  return data.session.user.id;
}

// 기존 익명 세션이 있으면 재사용하고, 없으면 즉석에서 익명 로그인 — 알림 구독/피드백 등
// 회원가입 없이 기기를 식별해야 하는 모든 곳에서 공용으로 씀
export function getOrCreateAnonymousUserId(): Promise<string> {
  if (!pendingUserId) {
    // 성공이든 실패든 끝나면 비워서, 실패 후 다음 호출이 다시 시도할 수 있게 함
    pendingUserId = resolveAnonymousUserId().finally(() => {
      pendingUserId = null;
    });
  }
  return pendingUserId;
}
