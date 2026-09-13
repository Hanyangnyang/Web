// 일반버스 정류소의 실제 탑승 위치를 카카오맵으로 보여주는 모달 시트
import { useEffect, useState } from 'react';
import { CustomOverlayMap, Map as KakaoMap, MapMarker, useKakaoLoader } from 'react-kakao-maps-sdk';
import { MapPin } from 'lucide-react';
import { STOP_COORDS } from '../../../domain/entities/PublicBus.js';
import { getDistanceKm } from '../../../domain/utils/haversine.js';
import { KAKAO_MAP_LIBRARIES } from '../../../lib/kakaoMap.js';
import { ModalBottomSheet } from '../ui/ModalBottomSheet.js';

const USER_LOCATION_DISPLAY_RADIUS_KM = 1.5;

interface BusStopLocationSheetProps {
  stopName: string;
  direction: string;
  userCoords: { latitude: number; longitude: number } | null;
  onClose: () => void;
}

export function BusStopLocationSheet({ stopName, direction, userCoords, onClose }: BusStopLocationSheetProps) {
  const [loading, error] = useKakaoLoader({
    appkey: import.meta.env.VITE_KAKAO_JS_KEY,
    libraries: KAKAO_MAP_LIBRARIES,
  });
  const coords = STOP_COORDS[stopName];
  const [map, setMap] = useState<kakao.maps.Map | null>(null);
  const shouldShowUserLocation = !!userCoords && !!coords &&
    getDistanceKm(userCoords.latitude, userCoords.longitude, coords.lat, coords.lon) <= USER_LOCATION_DISPLAY_RADIUS_KM;

  // 1.5km 이내일 때만 내 위치까지 함께 보여준다. 멀리 떨어진 위치로 지도가 과도하게 축소되는 것을 막는다.
  useEffect(() => {
    if (!map || !coords || !userCoords || !shouldShowUserLocation) return;
    const bounds = new kakao.maps.LatLngBounds();
    bounds.extend(new kakao.maps.LatLng(coords.lat, coords.lon));
    bounds.extend(new kakao.maps.LatLng(userCoords.latitude, userCoords.longitude));
    map.setBounds(bounds, 48, 48, 48, 48);
  }, [map, coords, userCoords, shouldShowUserLocation]);

  return (
    <ModalBottomSheet
      onRequestClose={onClose}
      onClose={onClose}
      enableDragToClose={false}
      className="w-full max-w-md rounded-t-3xl overflow-hidden"
    >
      <div className="px-5 pb-5">
        <div className="flex items-start gap-2 mb-4">
          <span className="mt-0.5 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
            <MapPin size={18} />
          </span>
          <div>
            <h2 className="text-[17px] font-extrabold text-text-main">{stopName} 정류장 위치</h2>
            <p className="text-[13px] font-medium text-text-sub mt-0.5">{direction} 탑승 정류장입니다.</p>
          </div>
        </div>

        <div className="h-64 rounded-2xl overflow-hidden bg-slate-100">
          {loading ? (
            <div className="h-full flex items-center justify-center text-sm font-semibold text-text-hint">지도를 불러오는 중이에요.</div>
          ) : error || !coords ? (
            <div className="h-full flex items-center justify-center text-sm font-semibold text-text-hint">정류장 위치를 불러올 수 없어요.</div>
          ) : (
            <KakaoMap center={{ lat: coords.lat, lng: coords.lon }} level={3} className="w-full h-full" onCreate={setMap}>
              <MapMarker position={{ lat: coords.lat, lng: coords.lon }} title={`${stopName} 정류장`} />
              {shouldShowUserLocation && userCoords && (
                <CustomOverlayMap position={{ lat: userCoords.latitude, lng: userCoords.longitude }} yAnchor={0.5} zIndex={30}>
                  <div className="relative pointer-events-none" aria-label="내 위치">
                    <span className="absolute inset-0 rounded-full bg-[#3B82F6]/40 animate-ping" />
                    <span className="relative block w-4 h-4 rounded-full bg-[#3B82F6] border-2 border-white shadow-[0_1px_4px_rgba(0,0,0,0.3)]" />
                  </div>
                </CustomOverlayMap>
              )}
            </KakaoMap>
          )}
        </div>
        <p className="text-[12px] text-text-hint font-medium mt-3">
          {shouldShowUserLocation ? '파란 점은 내 위치, 핀은 탑승 정류장입니다.' : '핀으로 표시된 위치에서 탑승해 주세요.'}
        </p>
      </div>
    </ModalBottomSheet>
  );
}
