-- 1. RLS 활성화 (기본적으로 모든 익명/인증 사용자 접근 차단)
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- 기존 정책이 있다면 충돌 방지를 위해 삭제
DROP POLICY IF EXISTS "Allow anonymous insert on devices" ON public.devices;
DROP POLICY IF EXISTS "Allow anonymous update on devices" ON public.devices;
DROP POLICY IF EXISTS "Allow anonymous select on devices" ON public.devices;
DROP POLICY IF EXISTS "Allow anonymous insert on subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Allow anonymous update on subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Allow anonymous select on subscriptions" ON public.subscriptions;

-- 2. 알림 설정 업데이트용 통합 RPC 함수 생성 (SECURITY DEFINER 적용)
CREATE OR REPLACE FUNCTION upsert_alarm_subscription(
  p_device_id uuid,
  p_fcm_token text,
  p_topic text,
  p_params jsonb,
  p_is_active boolean,
  p_platform text DEFAULT 'web'
) RETURNS void AS $$
BEGIN
  -- 1) FCM 토큰이 전달된 경우 Devices 테이블 갱신
  IF p_fcm_token IS NOT NULL THEN
    INSERT INTO public.devices (id, fcm_token, platform, last_active_at)
    VALUES (p_device_id, p_fcm_token, COALESCE(p_platform, 'web'), now())
    ON CONFLICT (id) DO UPDATE
    SET fcm_token = EXCLUDED.fcm_token,
        platform = COALESCE(EXCLUDED.platform, devices.platform),
        last_active_at = now();
  END IF;

  -- 2) Subscriptions 테이블 갱신
  INSERT INTO public.subscriptions (device_id, topic, params, is_active)
  VALUES (p_device_id, p_topic, p_params, p_is_active)
  ON CONFLICT (device_id, topic) DO UPDATE
  SET params = COALESCE(p_params, subscriptions.params),
      is_active = p_is_active,
      updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. 안전한 조회를 위한 RPC 함수 생성 (SECURITY DEFINER 적용)
-- 오직 파라미터로 넘어온 device_id와 일치하는 구독 정보만 반환
CREATE OR REPLACE FUNCTION get_alarm_subscription(
  p_device_id uuid,
  p_topic text
) RETURNS jsonb AS $$
DECLARE
  v_sub jsonb;
BEGIN
  SELECT jsonb_build_object(
    'is_active', is_active,
    'params', params
  )
  INTO v_sub
  FROM public.subscriptions
  WHERE device_id = p_device_id AND topic = p_topic;

  RETURN v_sub;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
