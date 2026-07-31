// 훅: 학식/날씨 알람 설정 시트가 공통으로 쓰는 구독 상태·서버 동기화 로직
// (localStorage 캐시, get/upsert_alarm_subscription RPC, 알림 권한 체크)
import { useEffect, useState } from 'react';
import { requestNotificationPermission, checkNotificationPermission } from '../../lib/firebase.js';
import { supabase, getOrCreateAnonymousUserId } from '../../lib/supabase.js';
import { getPlatform } from '../../lib/platform.js';

interface StoredState<TParams> {
  enabled: boolean;
  params: TParams;
}

export interface UseAlarmSubscriptionOptions<TParams> {
  // Supabase subscriptions 테이블에 저장되는 알림 종류 (ex: 'CAFETERIA_KEYWORD' | 'WEATHER_ALERT')
  topic: string;
  // localStorage 캐시 키
  storageKey: string;
  defaultParams: TParams;
  // enabled 토글이 켜져 있어도 실제로 구독 조건을 충족했는지는 토픽마다 다름
  // (ex: 학식 알림은 식당 선택 또는 키워드 등록까지 돼야 구독으로 침)
  isSubscribed: (enabled: boolean, params: TParams) => boolean;
  buildSuccessMessage: (params: TParams) => string;
}

export interface UseAlarmSubscriptionResult<TParams> {
  enabled: boolean;
  params: TParams;
  setParams: (updater: TParams | ((prev: TParams) => TParams)) => void;
  // 꺼져 있으면 알림 권한 체크 후 켬 (권한 없으면 alert + false 반환). 도메인 쪽 UI 조작 핸들러 앞단에서 호출
  ensureEnabled: () => Promise<boolean>;
  // 헤더 온오프 스위치 클릭 핸들러
  toggle: () => Promise<void>;
  // 시트가 닫히는 시점에 호출 — dirty할 때만 localStorage 저장 + 서버 반영(RPC)하고,
  // 구독 조건을 충족했으면 성공 메시지를, 아니면 undefined를 반환
  commitOnClose: () => string | undefined;
}

export function useAlarmSubscription<TParams>({
  topic,
  storageKey,
  defaultParams,
  isSubscribed,
  buildSuccessMessage,
}: UseAlarmSubscriptionOptions<TParams>): UseAlarmSubscriptionResult<TParams> {
  const loadSettings = (): StoredState<TParams> => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) return { enabled: false, params: defaultParams };
      const parsed = JSON.parse(saved) as Partial<StoredState<TParams>>;
      return {
        enabled: parsed.enabled ?? false,
        params: { ...defaultParams, ...parsed.params },
      };
    } catch {
      return { enabled: false, params: defaultParams };
    }
  };

  const [state, setState] = useState<StoredState<TParams>>(() => loadSettings());
  // 마지막으로 저장(localStorage/서버)된 값 — isDirty 비교 기준
  const [saved, setSaved] = useState<StoredState<TParams>>(() => loadSettings());

  const isDirty =
    state.enabled !== saved.enabled ||
    JSON.stringify(state.params) !== JSON.stringify(saved.params);

  const setParams = (updater: TParams | ((prev: TParams) => TParams)) => {
    setState(prev => ({
      ...prev,
      params: typeof updater === 'function' ? (updater as (prev: TParams) => TParams)(prev.params) : updater,
    }));
  };

  // 서버 설정과 동기화 (RPC 호출) — 마운트 시 1회
  useEffect(() => {
    async function syncWithServer() {
      try {
        const deviceId = await getOrCreateAnonymousUserId();
        const { data, error } = await supabase.rpc('get_alarm_subscription', {
          p_device_id: deviceId,
          p_topic: topic,
        });

        if (data && !error) {
          const nextState: StoredState<TParams> = {
            enabled: data.is_active,
            params: { ...defaultParams, ...data.params },
          };
          setState(nextState);
          setSaved(nextState);
          localStorage.setItem(storageKey, JSON.stringify(nextState));
        }
      } catch (err) {
        console.error(`Failed to sync alarm subscription (${topic})`, err);
      }
    }
    syncWithServer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ensureEnabled = async () => {
    if (!state.enabled) {
      const hasPerm = await checkNotificationPermission();
      if (!hasPerm) {
        alert('알림 권한을 허용해야 기능을 사용할 수 있습니다.');
        return false;
      }
      setState(prev => ({ ...prev, enabled: true }));
    }
    return true;
  };

  const toggle = async () => {
    const turningOn = !state.enabled;
    setState(prev => ({ ...prev, enabled: turningOn }));
    if (turningOn) {
      const hasPerm = await checkNotificationPermission();
      if (!hasPerm) {
        alert('알림 권한을 허용해야 기능을 사용할 수 있습니다.');
        setState(prev => ({ ...prev, enabled: false }));
      }
    }
  };

  const commitOnClose = (): string | undefined => {
    if (!isDirty) return undefined;

    const snapshot = state;
    localStorage.setItem(storageKey, JSON.stringify(snapshot));

    if (isSubscribed(snapshot.enabled, snapshot.params)) {
      const successMsg = buildSuccessMessage(snapshot.params);

      (async () => {
        try {
          const token = await requestNotificationPermission();
          if (token) {
            const deviceId = await getOrCreateAnonymousUserId();
            await supabase.rpc('upsert_alarm_subscription', {
              p_device_id: deviceId,
              p_fcm_token: token,
              p_topic: topic,
              p_params: snapshot.params,
              p_is_active: true,
              p_platform: getPlatform(),
            });
          }
        } catch (err) {
          console.error(`Failed to sync alarm subscription (${topic})`, err);
        }
      })();

      return successMsg;
    }

    if (!snapshot.enabled) {
      (async () => {
        try {
          const deviceId = await getOrCreateAnonymousUserId();
          await supabase.rpc('upsert_alarm_subscription', {
            p_device_id: deviceId,
            p_fcm_token: null,
            p_topic: topic,
            p_params: null,
            p_is_active: false,
            p_platform: getPlatform(),
          });
        } catch (err) {
          console.error(`Failed to sync alarm subscription status (${topic})`, err);
        }
      })();
    }

    return undefined;
  };

  return { enabled: state.enabled, params: state.params, setParams, ensureEnabled, toggle, commitOnClose };
}
