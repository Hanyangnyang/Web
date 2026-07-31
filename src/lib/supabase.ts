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

// 기존 익명 세션이 있으면 재사용하고, 없으면 즉석에서 익명 로그인 — 알림 구독/피드백 등
// 회원가입 없이 기기를 식별해야 하는 모든 곳에서 공용으로 씀
export async function getOrCreateAnonymousUserId(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user?.id) return session.user.id;

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  if (!data.session) throw new Error('Anonymous sign-in returned no session');
  return data.session.user.id;
}
