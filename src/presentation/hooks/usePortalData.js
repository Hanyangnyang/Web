import { useState, useEffect } from 'react';

export function usePortalData() {
  const [weather, setWeather] = useState(null);
  const [library, setLibrary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      
      try {
        const weatherPromise = fetch('/api/weather').then(res => res.ok ? res.json() : null);
        const libraryPromise = getLibraryData();

        const [weatherData, libData] = await Promise.all([weatherPromise, libraryPromise]);
        
        setWeather(weatherData);
        setLibrary(libData);
        
        if (!weatherData && !libData) {
          setError('데이터를 불러오는 중 오류가 발생했습니다.');
        }
      } catch (err) {
        console.error('Portal data fetch error:', err);
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
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
    const res = await fetch('/api/library');
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
    return null; // 가짜 데이터 대신 null 반환
  }
}
