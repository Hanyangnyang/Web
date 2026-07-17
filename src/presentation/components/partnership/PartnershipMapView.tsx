// 제휴탭 지도 화면: 카카오맵 기반으로 제휴 매장을 탐색한다
// SDK 스크립트는 이 컴포넌트가 처음 마운트될 때(제휴탭 최초 진입 시) 로드된다
import { Map, useKakaoLoader } from 'react-kakao-maps-sdk';

// 에리카 정문 — 위치 권한이 없거나 캠퍼스에서 먼 사용자의 기본 지도 중심
export const ERICA_MAIN_GATE = { lat: 37.2983, lng: 126.8388 } as const;

// 학교 앞 상권이 한눈에 들어오는 확대 수준 (1=최대 확대)
const DEFAULT_LEVEL = 4;

export default function PartnershipMapView() {
  const [loading, error] = useKakaoLoader({
    appkey: import.meta.env.VITE_KAKAO_JS_KEY,
    // clusterer: 마커 밀집 대비, services: 좌표↔주소 변환 대비
    libraries: ['clusterer', 'services'],
  });

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-2 text-text-hint">
        <span className="text-2xl">🗺️</span>
        <p className="text-sm font-bold">지도를 불러오지 못했어요</p>
        <p className="text-xs">네트워크 연결을 확인해주세요</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50">
        <span className="text-sm font-bold text-text-hint animate-pulse">지도 불러오는 중…</span>
      </div>
    );
  }

  return (
    <Map
      center={{ lat: ERICA_MAIN_GATE.lat, lng: ERICA_MAIN_GATE.lng }}
      level={DEFAULT_LEVEL}
      style={{ width: '100%', height: '100%' }}
    />
  );
}
