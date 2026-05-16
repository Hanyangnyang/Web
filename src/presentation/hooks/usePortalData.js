import { useState, useEffect } from 'react';

// 메모리 캐시: 앱 실행 중 탭 전환 시 즉시 데이터 제공
let memoryCache = null;
const CACHE_KEY = 'hyu_portal_cache';

export function usePortalData() {
  const [weather, setWeather] = useState(() => memoryCache?.weather || null);
  const [library, setLibrary] = useState(() => memoryCache?.library || null);
  const [loading, setLoading] = useState(!memoryCache);
  const [error, setError] = useState(null);

  useEffect(() => {
    // 1. 초기화: 메모리 캐시가 없으면 로컬 스토리지 확인
    if (!memoryCache) {
      const saved = localStorage.getItem(CACHE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // 1시간 이내 데이터면 유효한 것으로 간주하여 즉시 표시
          if (Date.now() - parsed.timestamp < 3600000) {
            setWeather(parsed.weather);
            setLibrary(parsed.library);
            setLoading(false);
          }
        } catch (e) {}
      }
    }

    async function fetchData() {
      // 캐시 데이터가 있으면 로딩을 보여주지 않고 백그라운드 업데이트
      if (!weather && !library) {
        setLoading(true);
      }
      setError(null);
      
      try {
        const weatherPromise = fetch('/api/portal?type=weather').then(res => res.ok ? res.json() : null);
        const libraryPromise = getLibraryData();

        const [weatherData, libData] = await Promise.all([weatherPromise, libraryPromise]);
        
        if (weatherData || libData) {
          const newData = {
            weather: weatherData || weather,
            library: libData || library,
            timestamp: Date.now()
          };
          
          memoryCache = newData;
          localStorage.setItem(CACHE_KEY, JSON.stringify(newData));
          
          setWeather(newData.weather);
          setLibrary(newData.library);
        }
        
        if (!weatherData && !libData && !weather && !library) {
          setError('데이터를 불러오는 중 오류가 발생했습니다.');
        }
      } catch (err) {
        console.error('Portal data fetch error:', err);
        if (!weather && !library) {
          setError('데이터를 불러오는 중 오류가 발생했습니다.');
        }
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return { weather, library, loading, error };
}

async function getLibraryData() {
  try {
    const res = await fetch('/api/portal?type=library');
    if (!res.ok) throw new Error('API call failed');
    const json = await res.json();
    
    if (json.success) {
      const list = json.data.list.map(room => {
        const total = room.seats.total;
        const occupied = room.seats.occupied;
        const ratio = occupied / total;
        
        let status = '쾌적';
        let color = '#2563eb'; 
        let emoji = '🔵';
        
        if (ratio > 0.67) {
          status = '매우 혼잡';
          color = '#991b1b'; 
          emoji = '😫';
        } else if (ratio > 0.5) {
          status = '혼잡';
          color = '#ef4444'; 
          emoji = '🔴';
        } else if (ratio > 0.33) {
          status = '보통';
          color = '#22c55e'; 
          emoji = '🟢';
        }

        return { id: room.id, name: room.name, total, occupied, ratio, status, color, emoji };
      });

      const sortOrder = [61, 63, 132, 131];
      list.sort((a, b) => sortOrder.indexOf(a.id) - sortOrder.indexOf(b.id));

      return { list, updatedAt: Date.now() };
    }
    return null;
  } catch (e) {
    console.warn('Library API fetch failed:', e);
    return null;
  }
}
