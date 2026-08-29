// 공용 모듈: 대한민국 법정공휴일 조회 (공공데이터포털 SpcdeInfoService)
// api/holidays.js가 쓴다 — 중복 구현 금지, 여기 하나만 유지
import fs from 'fs';
import path from 'path';
import os from 'os';

// Korean Public Holidays 2026 (Base fallback)
const HOLIDAYS_2026 = [
  '2026-01-01', '2026-02-16', '2026-02-17', '2026-02-18', '2026-03-01', '2026-03-02',
  '2026-05-05', '2026-05-24', '2026-05-25', '2026-06-03', '2026-06-06', '2026-08-15', '2026-08-17',
  '2026-09-24', '2026-09-25', '2026-09-26', '2026-10-03', '2026-10-05', '2026-10-09',
  '2026-12-25'
];

// 입력: year(number) → 출력: 그 해의 법정공휴일 날짜 문자열 배열 ('YYYY-MM-DD'[])
export async function getHolidays(year) {
  const cacheDir = path.join(os.tmpdir(), 'hanyang-subway-cache');
  try {
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
  } catch (e) {
    console.warn('[Holidays] Cache directory creation failed:', e.message);
  }
  const cachePath = path.join(cacheDir, `holidays_${year}.json`);

  let cache = null;
  try {
    if (fs.existsSync(cachePath)) {
      cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
      // Refresh once a week
      if (Date.now() - cache.lastUpdated < 7 * 24 * 60 * 60 * 1000) {
        return cache.data;
      }
    }
  } catch (e) { console.error('[Holidays] Cache read error:', e); }

  try {
    const key = process.env.HOLIDAY_KEY;
    if (!key) throw new Error('HOLIDAY_KEY not configured');

    const url = `http://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo?ServiceKey=${key}&solYear=${year}&_type=json&numOfRows=100`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    const json = await res.json();

    if (json.response?.header?.resultCode === '00') {
      let items = json.response.body?.items?.item || [];
      if (!Array.isArray(items)) items = [items];

      const holidayDates = items
        .filter(item => item.isHoliday === 'Y')
        .map(item => {
          const s = String(item.locdate);
          return `${s.substring(0, 4)}-${s.substring(4, 6)}-${s.substring(6, 8)}`;
        });

      const uniqueHolidays = Array.from(new Set(holidayDates)).sort();
      try {
        fs.writeFileSync(cachePath, JSON.stringify({ data: uniqueHolidays, lastUpdated: Date.now() }));
      } catch (writeErr) {
        console.error('[Holidays] Failed to write holidays cache file:', writeErr.message);
      }
      return uniqueHolidays;
    }
  } catch (e) {
    console.error('[Holidays] Holiday fetch failed:', e.message);
  }

  return cache ? cache.data : (year === 2026 ? HOLIDAYS_2026 : []);
}
