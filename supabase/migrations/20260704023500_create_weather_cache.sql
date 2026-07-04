CREATE TABLE IF NOT EXISTS public.weather_cache (
  id integer PRIMARY KEY DEFAULT 1,
  data jsonb NOT NULL,
  updated_at timestamp with time zone DEFAULT now()
);

-- RLS 활성화
ALTER TABLE public.weather_cache ENABLE ROW LEVEL SECURITY;

-- 누구나 읽을 수 있는 Policy (익명 사용자 조회 허용)
CREATE POLICY "Enable read access for all users" ON public.weather_cache
  FOR SELECT TO public USING (true);

-- service_role만 모든 권한 허용 (서버 측에서 갱신할 때 사용)
CREATE POLICY "Enable write access for service_role only" ON public.weather_cache
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 권한 부여 (Grants)
grant select on table "public"."weather_cache" to anon;
grant select on table "public"."weather_cache" to authenticated;
grant select on table "public"."weather_cache" to service_role;
grant insert, update, delete on table "public"."weather_cache" to service_role;

-- 초기 데이터 시드 삽입 (갱신 시간이 과거 1시간 전으로 설정되어 첫 호출 시 바로 API 조회가 유도되도록 함)
INSERT INTO public.weather_cache (id, data, updated_at)
VALUES (1, '{}'::jsonb, now() - interval '1 hour')
ON CONFLICT (id) DO NOTHING;
