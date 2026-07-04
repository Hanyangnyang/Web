// Vercel Serverless Function: Portal Data (Weather + Library)
// Hobby 플랜의 12개 함수 제한을 피하기 위해 기능을 통합했습니다.
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

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
    console.error('[Weather Portal API] Holiday fetch failed:', e.message);
  }

  return cache ? cache.data : (year === 2026 ? HOLIDAYS_2026 : []);
}

// Timezone-independent KST Date Details Helper
function getKSTDateDetails() {
  const utc = Date.now();
  const kst = new Date(utc + 9 * 60 * 60 * 1000);
  const yyyy = kst.getUTCFullYear();
  const mm = String(kst.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(kst.getUTCDate()).padStart(2, '0');
  const hour = kst.getUTCHours();
  const minute = kst.getUTCMinutes();
  
  return {
    yyyy,
    mm,
    dd,
    hour,
    minute,
    currentTimeVal: hour * 100 + minute,
    kstDate: kst
  };
}

// KMA Base Time Calculator
function getKMABaseTime(kstDetails) {
  const { yyyy, mm, dd, currentTimeVal, kstDate } = kstDetails;

  let baseDate = `${yyyy}${mm}${dd}`;
  let baseTime = '2300';

  if (currentTimeVal < 210) {
    const yesterday = new Date(kstDate.getTime() - 24 * 60 * 60 * 1000);
    const y_yyyy = yesterday.getUTCFullYear();
    const y_mm = String(yesterday.getUTCMonth() + 1).padStart(2, '0');
    const y_dd = String(yesterday.getUTCDate()).padStart(2, '0');
    baseDate = `${y_yyyy}${y_mm}${y_dd}`;
    baseTime = '2300';
  } else if (currentTimeVal < 510) {
    baseTime = '0200';
  } else if (currentTimeVal < 810) {
    baseTime = '0500';
  } else if (currentTimeVal < 1110) {
    baseTime = '0800';
  } else if (currentTimeVal < 1410) {
    baseTime = '1100';
  } else if (currentTimeVal < 1710) {
    baseTime = '1400';
  } else if (currentTimeVal < 2010) {
    baseTime = '1700';
  } else if (currentTimeVal < 2310) {
    baseTime = '2000';
  } else {
    baseTime = '2300';
  }

  return { baseDate, baseTime };
}

// Convert KMA PTY and SKY codes to portal weatherCode
function mapToWeatherCode(sky, pty) {
  const skyNum = parseInt(sky, 10);
  const ptyNum = parseInt(pty, 10);

  if (ptyNum === 1) return 63; // 비
  if (ptyNum === 2) return 73; // 비/눈 -> 눈
  if (ptyNum === 3) return 73; // 눈
  if (ptyNum === 4) return 80; // 소나기

  if (skyNum === 1) return 0;  // 맑음
  if (skyNum === 3) return 2;  // 구름조금
  if (skyNum === 4) return 3;  // 흐림
  
  return 0;
}

function getWeatherLabelAndEmoji(code) {
  const weatherCodeMap = {
    0: { label: '맑음', emoji: '☀️', message: '오늘은 맑고 화창한 날씨입니다. 즐거운 하루 보내세요!' },
    1: { label: '대체로 맑음', emoji: '🌤️', message: '구름 한 점 없는 맑은 하늘이네요!' },
    2: { label: '구름 조금', emoji: '⛅', message: '간간이 구름이 섞여 있어 걷기 좋은 날씨예요.' },
    3: { label: '흐림', emoji: '☁️', message: '구름이 해를 가려 어둑한 날씨가 이어집니다.' },
    45: { label: '안개', emoji: '🌫️', message: '안개가 짙으니 시야 확보에 주의하세요.' },
    48: { label: '안개', emoji: '🌫️', message: '짙은 안개가 깔려 있습니다.' },
    51: { label: '가벼운 이슬비', emoji: '🌦️', message: '부슬부슬 이슬비가 내리고 있어요. 우산을 챙기세요.' },
    53: { label: '이슬비', emoji: '🌦️', message: '약간의 이슬비가 내리고 있습니다.' },
    55: { label: '짙은 이슬비', emoji: '🌦️', message: '이슬비가 다소 강하게 내리고 있습니다.' },
    61: { label: '가벼운 비', emoji: '🌧️', message: '촉촉하게 가벼운 비가 내리는 날입니다.' },
    63: { label: '비', emoji: '🌧️', message: '비가 내리고 있으니 빗길 운전에 주의하세요.' },
    65: { label: '강한 비', emoji: '🌧️', message: '비바람이 거세니 외출 시 조심하세요.' },
    71: { label: '가벼운 눈', emoji: '❄️', message: '함박눈은 아니지만 포근하게 눈이 내리네요.' },
    73: { label: '눈', emoji: '❄️', message: '하얀 눈이 내리는 낭만적인 날씨입니다.' },
    75: { label: '강한 눈', emoji: '❄️', message: '눈이 많이 쌓이고 있으니 낙상에 주의하세요.' },
    80: { label: '소나기', emoji: '🚿', message: '갑작스러운 소나기에 대비해 우산을 챙기세요.' },
    95: { label: '뇌우', emoji: '⚡', message: '천둥 번개를 동반한 비가 오니 안전에 유의하세요.' }
  };
  return weatherCodeMap[code] || { label: '정보 없음', emoji: '🌡️', message: '현재 날씨 정보를 불러오고 있습니다.' };
}

function getAQILabel(val, type) {
  const v = parseInt(val, 10);
  if (isNaN(v)) return { label: '점검중', color: '#94a3b8', level: 1 };
  
  if (type === 'pm10') {
    if (v <= 30) return { label: '좋음', color: '#2563eb', level: 1 };
    if (v <= 80) return { label: '보통', color: '#4ade80', level: 2 };
    if (v <= 150) return { label: '나쁨', color: '#ef4444', level: 3 };
    return { label: '매우나쁨', color: '#991b1b', level: 4 };
  } else if (type === 'pm25') {
    if (v <= 15) return { label: '좋음', color: '#2563eb', level: 1 };
    if (v <= 35) return { label: '보통', color: '#4ade80', level: 2 };
    if (v <= 75) return { label: '나쁨', color: '#ef4444', level: 3 };
    return { label: '매우나쁨', color: '#991b1b', level: 4 };
  }
}

// Logical UV Index approximation based on time and cloud coverage
function estimateUV(kstDetails, skyCode) {
  const hour = kstDetails.hour;
  const sky = parseInt(skyCode, 10);
  
  if (hour < 7 || hour > 18) {
    return { label: '낮음', color: '#2563eb', level: 1 };
  }
  
  if (sky === 1) {
    if (hour >= 11 && hour <= 14) return { label: '매우높음', color: '#991b1b', level: 4 };
    if (hour >= 9 && hour <= 16) return { label: '높음', color: '#ef4444', level: 3 };
    return { label: '보통', color: '#4ade80', level: 2 };
  }
  if (sky === 3) {
    if (hour >= 11 && hour <= 14) return { label: '높음', color: '#ef4444', level: 3 };
    return { label: '보통', color: '#4ade80', level: 2 };
  }
  return { label: '낮음', color: '#2563eb', level: 1 };
}

export default async function handler(req, res) {
  const { type } = req.query;

  if (type === 'weather') {
    return handleWeather(req, res);
  } else if (type === 'library') {
    return handleLibrary(req, res);
  } else {
    return res.status(400).json({ error: 'Invalid type' });
  }
}

async function handleWeather(req, res) {
  const CACHE_TTL = 30 * 60 * 1000; // 30 minutes cache

  try {
    // 1. Supabase에서 캐시된 날씨 정보를 먼저 읽어옴
    const { data: cacheRow, error: cacheError } = await supabase
      .from('weather_cache')
      .select('data, updated_at')
      .eq('id', 1)
      .single();

    const now = Date.now();
    const hasValidCache = cacheRow && 
                          cacheRow.updated_at && 
                          (now - new Date(cacheRow.updated_at).getTime() < CACHE_TTL);

    if (hasValidCache && cacheRow.data && Object.keys(cacheRow.data).length > 0) {
      console.info('[Weather Portal API] Serving fresh weather data from Supabase DB cache');
      res.setHeader('Cache-Control', 'public, max-age=1800, s-maxage=1800, stale-while-revalidate=60');
      return res.status(200).json(cacheRow.data);
    }

    console.info('[Weather Portal API] Cache expired or missing. Fetching new weather from KMA & AirKorea...');

    // 2. 새로운 기상 정보 가져오기
    const apiKey = process.env.WEATHER_KEY || process.env.BUS_KEY;
    if (!apiKey) {
      throw new Error('WEATHER_KEY or BUS_KEY is not configured');
    }
    const encodedKey = apiKey.includes('%') ? apiKey : encodeURIComponent(apiKey);

    const kstDetails = getKSTDateDetails();
    const { baseDate, baseTime } = getKMABaseTime(kstDetails);

    // KMA 단기예보 URL (6초 타임아웃)
    const nx = 57;
    const ny = 121;
    const kmaUrl = `https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst?serviceKey=${encodedKey}&pageNo=1&numOfRows=1000&dataType=JSON&base_date=${baseDate}&base_time=${baseTime}&nx=${nx}&ny=${ny}`;

    // 에어코리아 대기오염정보 URL (6초 타임아웃)
    const stationName = encodeURIComponent('본오동');
    const airUrl = `https://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getMsrstnAcctoRltmMesureDnsty?serviceKey=${encodedKey}&returnType=json&numOfRows=1&pageNo=1&stationName=${stationName}&dataTerm=DAILY&ver=1.3`;

    let kmaItems = null;
    let airItem = null;

    try {
      const [kmaRes, airRes] = await Promise.all([
        fetch(kmaUrl, { signal: AbortSignal.timeout(6000) }),
        fetch(airUrl, { signal: AbortSignal.timeout(6000) })
      ]);

      if (kmaRes.ok) {
        const json = await kmaRes.json();
        kmaItems = json.response?.body?.items?.item;
      } else {
        console.warn(`KMA API response failure: HTTP ${kmaRes.status}`);
      }

      if (airRes.ok) {
        const json = await airRes.json();
        airItem = json.response?.body?.items?.[0];
      } else {
        console.warn(`AirKorea API response failure: HTTP ${airRes.status}`);
      }
    } catch (fetchErr) {
      console.warn('Failed to fetch public APIs, attempting to fall back to stale cache:', fetchErr.message);
    }

    // 만약 KMA 호출이 실패하여 기상청 데이터가 없으면, DB의 Stale 캐시를 돌려줌
    if (!kmaItems) {
      if (cacheRow && cacheRow.data && Object.keys(cacheRow.data).length > 0) {
        console.info('[Weather Portal API] Serving stale weather data from Supabase DB cache due to API error');
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
        return res.status(200).json(cacheRow.data);
      }
      throw new Error('KMA API failed and no cached weather data is available');
    }

    // 3. 기상 데이터 파싱 및 가공
    const forecastGroups = {};
    kmaItems.forEach(item => {
      const key = `${item.fcstDate}_${item.fcstTime}`;
      if (!forecastGroups[key]) forecastGroups[key] = {};
      forecastGroups[key][item.category] = item.fcstValue;
    });

    const todayStr = `${kstDetails.yyyy}${kstDetails.mm}${kstDetails.dd}`;
    const sortedTimes = Object.keys(forecastGroups).sort();
    const currentKSTHourStr = String(kstDetails.hour).padStart(2, '0') + '00';
    const currentKey = `${todayStr}_${currentKSTHourStr}`;

    let currentGroup = forecastGroups[currentKey];
    if (!currentGroup) {
      const futureKeys = sortedTimes.filter(k => k >= `${todayStr}_${currentKSTHourStr}`);
      if (futureKeys.length > 0) {
        currentGroup = forecastGroups[futureKeys[0]];
      } else {
        currentGroup = forecastGroups[sortedTimes[0]];
      }
    }

    const currentTemp = Math.round(parseFloat(currentGroup.TMP));
    const currentSky = currentGroup.SKY;
    const currentPty = currentGroup.PTY;
    const currentWeatherCode = mapToWeatherCode(currentSky, currentPty);
    const info = getWeatherLabelAndEmoji(currentWeatherCode);

    const todayTemps = Object.entries(forecastGroups)
      .filter(([key]) => key.startsWith(todayStr))
      .map(([, group]) => parseFloat(group.TMP))
      .filter(t => !isNaN(t));

    const maxTemp = todayTemps.length > 0 ? Math.round(Math.max(...todayTemps)) : currentTemp;
    const minTemp = todayTemps.length > 0 ? Math.round(Math.min(...todayTemps)) : currentTemp;

    const hourlyForecast = sortedTimes
      .slice(0, 24)
      .map(key => {
        const [fDate, fTime] = key.split('_');
        const fYear = fDate.substring(0, 4);
        const fMonth = fDate.substring(4, 6);
        const fDay = fDate.substring(6, 8);
        const fHour = fTime.substring(0, 2);
        
        const group = forecastGroups[key];
        const sky = group.SKY;
        const pty = group.PTY;
        const code = mapToWeatherCode(sky, pty);
        const temp = Math.round(parseFloat(group.TMP));
        const precipProb = parseInt(group.POP, 10) || 0;

        const timeISO = `${fYear}-${fMonth}-${fDay}T${fHour}:00`;
        const epoch = new Date(`${fYear}-${fMonth}-${fDay}T${fHour}:00+09:00`).getTime();

        return {
          time: timeISO,
          epoch,
          hour: parseInt(fHour, 10),
          temp,
          weatherCode: code,
          precipProb
        };
      });

    // 대기질 매핑
    const pm10Value = airItem?.pm10Value || 'NaN';
    const pm25Value = airItem?.pm25Value || 'NaN';
    
    // 에어코리아 응답이 없으면 DB 캐시에서 이전 미세먼지 수치를 재활용
    let pm10Info, pm25Info;
    if (airItem) {
      pm10Info = getAQILabel(pm10Value, 'pm10');
      pm25Info = getAQILabel(pm25Value, 'pm25');
    } else if (cacheRow?.data?.airQuality) {
      pm10Info = cacheRow.data.airQuality.pm10;
      pm25Info = cacheRow.data.airQuality.pm25;
    } else {
      pm10Info = getAQILabel('NaN', 'pm10');
      pm25Info = getAQILabel('NaN', 'pm25');
    }
    const uvInfo = estimateUV(kstDetails, currentSky);

    // 4. Gemini AI 코멘트 생성
    const hour = kstDetails.hour;
    let timeOfDayLabel = '하루';
    let timeContext = '현재 기상 정보를 요약해줘.';

    const year = kstDetails.yyyy;
    const holidays = await getHolidays(year);
    const yyyymmdd = `${year}-${kstDetails.mm}-${kstDetails.dd}`;
    const isHoliday = holidays.includes(yyyymmdd);
    const day = kstDetails.kstDate.getUTCDay(); // 0 = 일요일, ..., 6 = 토요일
    const isWeekend = day === 0 || day === 6;

    if (isHoliday || isWeekend) {
      timeOfDayLabel = '휴일/주말';
      timeContext = '오늘은 편안한 주말 또는 공휴일입니다. 학교, 등교, 하교, 출근, 퇴근 관련 언급을 절대 하지 말고, 오늘 날씨가 어떤지(기온, 미세먼지, 비 소식 등)만 가볍고 친근하게 알려주세요.';
    } else {
      if (hour >= 5 && hour < 12) {
        timeOfDayLabel = '아침/등교 시간대';
        timeContext = '상쾌한 아침 등교길 인사와 함께 오늘 하루 전반적인 날씨 대비 요령을 조언해줘.';
      } else if (hour >= 12 && hour < 17) {
        timeOfDayLabel = '낮/활동 시간대';
        timeContext = '활기찬 낮 일과 중 조언과 함께 자외선, 미세먼지 등 실외 활동 대비 요령을 조언해줘.';
      } else if (hour >= 17 && hour < 21) {
        timeOfDayLabel = '저녁/하교 시간대';
        timeContext = '수고한 하루를 마무리하는 따뜻한 인사와 함께 퇴근/하굣길 날씨(쌀쌀함 등)나 밤사이 유의사항을 조언해줘.';
      } else {
        timeOfDayLabel = '밤/새벽 시간대';
        timeContext = '편안한 밤을 보내기 위한 인사와 함께 내일 등교길이나 출근길 날씨를 가볍게 대비할 수 있도록 조언해줘.';
      }
    }

    const remainingTodayForecast = hourlyForecast.filter(h => {
      const hDate = new Date(`${h.time}+09:00`);
      return hDate.getDate() === kstDetails.kstDate.getUTCDate() && h.hour > hour;
    });

    const maxPrecipProb = remainingTodayForecast.length > 0
      ? Math.max(...remainingTodayForecast.map(h => h.precipProb))
      : 0;

    const hasRainOrSnowLater = remainingTodayForecast.some(h => h.precipProb >= 30 || h.weatherCode >= 51);

    let aiMessage = info.message; // 기본 폴백
    const geminiKey = process.env.GEMINI_API_KEY;
    let isAiSuccess = false;

    if (geminiKey && geminiKey !== '여기에_API_키_입력') {
      try {
        const prompt = `너는 날씨 앱의 AI 어시스턴트야. 아래 날씨 데이터와 [현재 시간대] 정보를 바탕으로 한국 대학생에게 친근하고 자연스러운 한국어로 오늘 날씨 코멘트를 한 문장으로 작성해줘.

현재 시간대: ${timeOfDayLabel} (${hour}시)
맥락 가이드: ${timeContext}

현재 기온: ${currentTemp}°C (오늘 최고 ${maxTemp}°C / 최저 ${minTemp}°C)
날씨 상태: ${info.label}
미세먼지: ${pm10Info.label} / 초미세먼지: ${pm25Info.label} / 자외선: ${uvInfo.label}
현재 강수 여부: ${currentPty > 0 ? '비 또는 눈 내리는 중' : '없음'}
오늘 중 비/눈 예보 여부: ${hasRainOrSnowLater ? `있음 (오늘 남은 시간 최고 강수확률 ${maxPrecipProb}%, 우산을 꼭 챙기도록 친근하게 조언해줘)` : '없음'}

규칙:
- 한 문장으로 매우 짧고 간결하게 작성할 것 (대략 30자 이내)
- 실용적인 조언(외투, 우산, 자외선차단제 등)을 자연스럽게 포함
- 이모지 사용 금지
- 반말 금지, 친근한 존댓말 사용
- 문장 부호로만 끝낼 것 (마침표 또는 느낌표)
- 주말이나 공휴일일 경우(현재 시간대가 '휴일/주말'일 경우), 학교, 등교, 하교, 출근, 퇴근, 과제, 수업 등의 학업/업무 관련 표현을 절대로 사용하지 말 것
- 오직 코멘트 문장만 출력, 다른 말 하지 말 것`;

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { maxOutputTokens: 1024, temperature: 0.8 }
            })
          }
        );

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const generated = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (generated && generated.length > 0) {
            aiMessage = generated;
            isAiSuccess = true;
          }
        }
      } catch (e) {
        console.warn('Gemini API 호출 실패, 정적 메시지 사용:', e.message);
      }
    }

    const responseData = {
      temp: currentTemp,
      description: info.label,
      emoji: info.emoji,
      weatherCode: currentWeatherCode,
      message: aiMessage,
      isAiMessage: aiMessage !== info.message,
      hasPrecipitation: currentPty > 0,
      hourlyForecast,
      airQuality: {
        pm10: pm10Info,
        pm25: pm25Info,
        uv: uvInfo
      }
    };

    // 5. DB 캐시 업데이트
    try {
      const { error: upsertError } = await supabase
        .from('weather_cache')
        .upsert({ id: 1, data: responseData, updated_at: new Date().toISOString() });
      
      if (upsertError) {
        console.error('[Weather Portal API] DB cache upsert failed:', upsertError.message);
      } else {
        console.info('[Weather Portal API] Weather data cached successfully in Supabase DB');
      }
    } catch (dbErr) {
      console.error('[Weather Portal API] DB cache write error:', dbErr.message);
    }

    // 6. 응답
    res.setHeader('Cache-Control', 'public, max-age=1800, s-maxage=1800, stale-while-revalidate=60');
    return res.status(200).json(responseData);

  } catch (error) {
    console.error('Weather error:', error);
    // 최후의 최후 폴백 (DB 조차 맛탱이 가고 API도 실패한 경우)
    const fallbackMock = {
      temp: 20,
      description: '연결 지연',
      emoji: '⚠️',
      weatherCode: 3,
      message: '날씨 정보를 불러올 수 없습니다.',
      isAiMessage: false,
      hasPrecipitation: false,
      hourlyForecast: [],
      airQuality: {
        pm10: { label: '점검중', color: '#94a3b8', level: 1 },
        pm25: { label: '점검중', color: '#94a3b8', level: 1 },
        uv: { label: '낮음', color: '#2563eb', level: 1 }
      }
    };
    return res.status(200).json(fallbackMock);
  }
}

async function handleLibrary(req, res) {
  try {
    const response = await fetch('https://lib.hanyang.ac.kr/pyxis-api/2/seat-rooms?smufMethodCode=PC&roomTypeId=7&branchGroupId=2', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36',
        'Referer': 'https://information.hanyang.ac.kr/',
        'Origin': 'https://information.hanyang.ac.kr'
      }
    });

    if (!response.ok) {
      throw new Error(`Library API responded with status ${response.status}`);
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Library API Proxy Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
