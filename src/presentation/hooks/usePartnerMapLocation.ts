// 훅: 캠퍼스맵 '내 위치' 버튼 — 온디맨드 측위 후 학교 인근이면 지도 중심 이동
import { useCallback, useState } from 'react';
import { measureLocation } from './useLocation.js';
import { distanceMeters } from '../../lib/geo.js';
import { ERICA_MAIN_GATE } from '../../domain/entities/PartnerStore.js';

// 이 거리 밖이면 '학교 근처가 아님'으로 보고 현위치로 센터를 옮기지 않는다
const ERICA_NEARBY_RADIUS_M = 2000;

interface Params {
  panTo: (lat: number, lng: number) => void;
  onMessage: (message: string) => void;
  posthog?: { capture: (event: string, props?: Record<string, unknown>) => void };
}

export function usePartnerMapLocation({ panTo, onMessage, posthog }: Params) {
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);

  // 이 시점에 최초 권한 요청이 일어난다 (진입 즉시 팝업을 띄우지 않기 위함)
  const locateMe = useCallback(async () => {
    if (locating) return;
    setLocating(true);
    posthog?.capture('partner_map_locate_clicked');
    try {
      const pos = await measureLocation();
      setUserPos({ lat: pos.latitude, lng: pos.longitude });
      const distFromCampus = distanceMeters(pos.latitude, pos.longitude, ERICA_MAIN_GATE.lat, ERICA_MAIN_GATE.lng);
      if (distFromCampus <= ERICA_NEARBY_RADIUS_M) {
        panTo(pos.latitude, pos.longitude);
      } else {
        onMessage('학교 근처가 아니라 지도를 이동하지 않았어요');
      }
    } catch {
      onMessage('위치를 가져오지 못했어요. 위치 권한을 확인해주세요');
    } finally {
      setLocating(false);
    }
  }, [locating, panTo, posthog, onMessage]);

  return { userPos, locating, locateMe };
}
