// Vercel Serverless Function: 배너 목록 (Supabase banners 테이블 프록시)
// 응답을 Vercel CDN에 캐싱해서(s-maxage) Supabase 직접 조회를 줄인다.
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  try {
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;

    // CDN 1시간 캐시 + 만료 후 24시간은 낡은 응답을 즉시 주면서 백그라운드 갱신
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).json({ banners: data });
  } catch (error) {
    console.error('[banners] fetch failed:', error.message);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(502).json({ banners: [], error: true });
  }
}
