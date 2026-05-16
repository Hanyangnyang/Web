import fs from 'fs';
import path from 'path';

let subwayCache = null;
let subwayCacheTime = 0;
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

// Timetable cache (stores day-type schedules for 7 days)
let timetableCache = {
  '1': { data: null, lastUpdated: 0 },
  '2': { data: null, lastUpdated: 0 },
  '3': { data: null, lastUpdated: 0 }
};
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// Korean Public Holidays 2026 (Base fallback)
const HOLIDAYS_2026 = [
  '2026-01-01', '2026-02-16', '2026-02-17', '2026-02-18', '2026-03-01', '2026-03-02',
  '2026-05-05', '2026-05-24', '2026-05-25', '2026-06-06', '2026-08-15', '2026-08-17',
  '2026-09-24', '2026-09-25', '2026-09-26', '2026-10-03', '2026-10-05', '2026-10-09',
  '2026-12-25'
];

async function getHolidays(year) {
  const cacheDir = path.join(process.cwd(), 'api', 'cache');
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
  const cachePath = path.join(cacheDir, `holidays_${year}.json`);

  let cache = null;
  if (fs.existsSync(cachePath)) {
    try {
      cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
      // Refresh once a month (30 days)
      if (Date.now() - cache.lastUpdated < 30 * 24 * 60 * 60 * 1000) {
        return cache.data;
      }
    } catch (e) { console.error('Holiday cache read error:', e); }
  }

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
      fs.writeFileSync(cachePath, JSON.stringify({ data: uniqueHolidays, lastUpdated: Date.now() }));
      return uniqueHolidays;
    }
  } catch (e) {
    console.error('[Subway API] Holiday fetch failed:', e.message);
  }

  return cache ? cache.data : (year === 2026 ? HOLIDAYS_2026 : []);
}

// Station codes for SearchSTNTimeTableByIDService
const STATION_CODES = {
  '1004': '1755', // Line 4
  '1075': 'K251', // Suin-Bundang
};

const TTL_30_DAYS = 30 * 24 * 60 * 60 * 1000;

async function refreshTimetableIfNeeded(lineId, key) {
  const fileName = lineId === '1004' ? 'line4_timetable.json' : 'suin_timetable.json';
  const filePath = path.join(process.cwd(), 'api', '_lib', fileName);
  const stCode = STATION_CODES[lineId];

  try {
    let currentData = null;
    if (fs.existsSync(filePath)) {
      currentData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const lastUpdated = new Date(currentData.metadata?.lastUpdated || 0).getTime();
      if (Date.now() - lastUpdated < TTL_30_DAYS) {
        return currentData;
      }
      console.log(`[Subway API] ${lineId} timetable is older than 30 days. Refreshing...`);
    }

    const result = {
      metadata: { lastUpdated: new Date().toISOString() },
      weekday: { upward: [], downward: [] },
      saturday: { upward: [], downward: [] },
      holiday: { upward: [], downward: [] }
    };

    const dayMap = { '1': 'weekday', '2': 'saturday', '3': 'holiday' };
    for (const [dayTag, dayKey] of Object.entries(dayMap)) {
      for (const upDown of ['1', '2']) {
        const url = `http://openAPI.seoul.go.kr:8088/${key}/json/SearchSTNTimeTableByIDService/1/1000/${stCode}/${dayTag}/${upDown}/`;
        try {
          const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
          const data = await res.json();
          if (data.SearchSTNTimeTableByIDService) {
            const rows = data.SearchSTNTimeTableByIDService.row || [];
            const dirKey = upDown === '1' ? 'upward' : 'downward';
            result[dayKey][dirKey] = rows.map(r => ({
              time: r.ARRIVETIME,
              destination: r.SUBWAYENAME,
              train_no: r.TRAIN_NO
            }));
          }
        } catch (e) { console.error(`[Subway API] Refresh fetch failed for ${lineId} (${dayKey}):`, e.message); }
      }
    }

    // Only write if we actually got some data (avoid wiping file on API failure)
    if (result.weekday.upward.length > 0) {
      fs.writeFileSync(filePath, JSON.stringify(result, null, 2));
      console.log(`[Subway API] Successfully updated ${fileName}`);
      return result;
    }
    return currentData; // Fallback to old data if refresh failed
  } catch (e) {
    console.error(`[Subway API] Critical error refreshing ${lineId}:`, e.message);
    return null;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') return res.status(405).end();

  const now = new Date();
  const kstOffset = 9 * 60; // KST is UTC+9
  const nowKst = new Date(now.getTime() + (kstOffset + now.getTimezoneOffset()) * 60000);
  const hour = nowKst.getHours();
  const nowMs = now.getTime();

  const isFull = req.query.full === 'true';
  const reqDayType = req.query.dayType; // '평일' or '주말'

  // Serve warm cache if still fresh and not a special query
  if (!isFull && !reqDayType && subwayCache && nowMs - subwayCacheTime < CACHE_TTL) {
    return res.status(200).json(subwayCache);
  }

  const key = process.env.SUBWAY_KEY;
  if (!key) return res.status(500).json({ error: 'SUBWAY_KEY env var not configured' });

  // Realtime API fetch removed per user request to rely purely on static timetables

  try {
    // 2. Load/Fetch Timetables
    const year = nowKst.getFullYear();
    const holidays = await getHolidays(year);
    const yyyymmdd = `${year}-${String(nowKst.getMonth() + 1).padStart(2, '0')}-${String(nowKst.getDate()).padStart(2, '0')}`;
    const isHoliday = holidays.includes(yyyymmdd);
    const day = nowKst.getDay();
    
    let dayTag = '1'; // Weekday
    if (reqDayType) {
      dayTag = reqDayType === '주말' ? '3' : '1';
    } else {
      if (day === 0 || isHoliday) dayTag = '3'; // Sunday/Holiday
      else if (day === 6) dayTag = '2'; // Saturday
    }

    const cacheEntry = timetableCache[dayTag];

    // Update timetable cache if empty or older than 1 week
    if (!cacheEntry.data || nowMs - cacheEntry.lastUpdated > WEEK_MS) {
      const ttResults = [];
      const seenTrains = new Set();
      const dayKey = dayTag === '1' ? 'weekday' : (dayTag === '2' ? 'saturday' : 'holiday');

      // Process both Line 4 and Suin-Bundang
      for (const lineId of ['1004', '1075']) {
        const localData = await refreshTimetableIfNeeded(lineId, key);
        if (localData) {
          // Fallback logic for missing saturday in old JSONs
          const lineData = localData[dayKey] || localData['holiday']; 
          
          ['upward', 'downward'].forEach(dir => {
            const updnLine = dir === 'upward' ? '상행' : '하행';
            (lineData[dir] || []).forEach(r => {
              const trainId = `${lineId}-${updnLine}-${r.train_no}`;
              if (!seenTrains.has(trainId)) {
                seenTrains.add(trainId);
                
                let destination = r.destination;
                if (lineId === '1004' && destination === '당고개') destination = '불암산';
                if (lineId === '1075' && destination === '신인천') destination = '인천';

                ttResults.push({
                  subwayId: lineId,
                  updnLine: updnLine,
                  dest: destination,
                  arrTime: r.time.substring(0, 5),
                  trainNo: r.train_no,
                  isRealtime: false,
                });
              }
            });
          });
        }
      }
      timetableCache[dayTag] = { data: ttResults, lastUpdated: nowMs };
    }


    // 3. Filter Future Timetable Entries
    const combined = [];
    const nowHHMM = `${String(hour).padStart(2, '0')}:${String(nowKst.getMinutes()).padStart(2, '0')}`;
    // console.log(`[Subway API] DayTag: ${dayTag}, Time: ${nowHHMM}, Full: ${isFull}`);
    
    timetableCache[dayTag].data.forEach(tt => {
      if (isFull || tt.arrTime >= nowHHMM) {
        combined.push(tt);
      }
    });

    combined.sort((a, b) => a.arrTime.localeCompare(b.arrTime));

    const line4Count = combined.filter(c => c.subwayId === '1004').length;
    const suinCount = combined.filter(c => c.subwayId === '1075').length;
    // console.log(`[Subway API] Final Response -> Line 4: ${line4Count}, Suin: ${suinCount}`);

    const result = { arrivals: combined, isHoliday };
    
    if (!isFull && !reqDayType) {
      subwayCache = result;
      subwayCacheTime = nowMs;
    }
    
    return res.status(200).json(result);
  } catch (err) {
    console.error('[Subway API] Fatal Error:', err);
    if (subwayCache) return res.status(200).json({ ...subwayCache, stale: true });
    return res.status(500).json({ error: err.message });
  }
}
