// Vercel Serverless Function: Portal Data (Weather + Library)
// Hobby 플랜의 12개 함수 제한을 피하기 위해 기능을 통합했습니다.

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
  try {
    const lat = 37.297;
    const lon = 126.834;

    const [weatherRes, airRes] = await Promise.all([
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code&hourly=temperature_2m,weather_code,precipitation_probability&timezone=Asia%2FSeoul&models=icon_seamless&forecast_days=2`),
      fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm10,pm2_5,uv_index&timezone=Asia%2FSeoul`)
    ]);

    if (!weatherRes.ok) {
      const text = await weatherRes.text();
      throw new Error(`Weather API failed (${weatherRes.status}): ${text.substring(0, 300)}`);
    }
    if (!airRes.ok) {
      const text = await airRes.text();
      throw new Error(`Air Quality API failed (${airRes.status}): ${text.substring(0, 300)}`);
    }

    const weatherData = await weatherRes.json();
    const airData = await airRes.json();

    const current = weatherData.current;
    const air = airData.current;

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

    const info = weatherCodeMap[current.weather_code] || { label: '정보 없음', emoji: '🌡️', message: '현재 날씨 정보를 불러오고 있습니다.' };

    const getAQILabel = (val, type) => {
      if (type === 'pm10') {
        if (val <= 30) return { label: '좋음', color: '#2563eb' };
        if (val <= 80) return { label: '보통', color: '#22c55e' };
        if (val <= 150) return { label: '나쁨', color: '#ef4444' };
        return { label: '매우나쁨', color: '#991b1b' };
      } else if (type === 'pm25') {
        if (val <= 15) return { label: '좋음', color: '#2563eb' };
        if (val <= 35) return { label: '보통', color: '#22c55e' };
        if (val <= 75) return { label: '나쁨', color: '#ef4444' };
        return { label: '매우나쁨', color: '#991b1b' };
      } else { // UV
        if (val <= 2) return { label: '낮음', color: '#2563eb' };
        if (val <= 5) return { label: '보통', color: '#22c55e' };
        if (val <= 7) return { label: '높음', color: '#ef4444' };
        return { label: '매우높음', color: '#991b1b' };
      }
    };

    const hourly = weatherData.hourly;
    const hourlyForecast = hourly.time.map((time, i) => {
      const itemDate = new Date(`${time}+09:00`);
      return {
        time, // "2026-05-17T18:00"
        epoch: itemDate.getTime(),
        hour: itemDate.getHours(),
        temp: Math.round(hourly.temperature_2m[i]),
        weatherCode: hourly.weather_code[i],
        precipProb: hourly.precipitation_probability[i]
      };
    });

    // 오늘 하루 전체 기온 범위 계산 (오늘 날짜와 매칭되는 24개 노드 기준)
    const nowKST = new Date(new Date().getTime() + 9 * 60 * 60 * 1000);
    const todayStr = nowKST.toISOString().split('T')[0];
    const todayTemps = hourly.time
      .map((time, i) => ({ time, temp: hourly.temperature_2m[i] }))
      .filter(item => item.time.startsWith(todayStr))
      .map(item => item.temp);

    const maxTemp = todayTemps.length > 0 ? Math.round(Math.max(...todayTemps)) : Math.round(Math.max(...hourly.temperature_2m));
    const minTemp = todayTemps.length > 0 ? Math.round(Math.min(...todayTemps)) : Math.round(Math.min(...hourly.temperature_2m));

    // Gemini AI로 날씨 코멘트 생성 (실패 시 정적 메시지 폴백)
    const pm10Info = getAQILabel(air.pm10, 'pm10');
    const pm25Info = getAQILabel(air.pm2_5, 'pm25');
    const uvInfo = getAQILabel(air.uv_index, 'uv');

    // 현재 KST 시각 기준 시간대 라벨 정의 (Gemini 프롬프트 시간대 인지 강화)
    const hour = nowKST.getHours();
    let timeOfDayLabel = '하루';
    let timeContext = '현재 기상 정보를 요약해줘.';

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

    // 오늘 중 현재 시간 이후 비/눈 예보가 있는지 판단
    const hasRainOrSnowLater = hourlyForecast.some(h => {
      const hDate = new Date(`${h.time}+09:00`);
      return hDate.getDate() === nowKST.getDate() && h.hour > hour && (h.precipProb >= 30 || h.weatherCode >= 51);
    });

    let aiMessage = info.message; // 기본 폴백
    const geminiKey = process.env.GEMINI_API_KEY;
    let isAiSuccess = false;

    if (geminiKey && geminiKey !== '여기에_API_키_입력') {
      try {
        const prompt = `너는 날씨 앱의 AI 어시스턴트야. 아래 날씨 데이터와 [현재 시간대] 정보를 바탕으로 한국 대학생에게 친근하고 자연스러운 한국어로 오늘 날씨 코멘트를 한 문장으로 작성해줘.

현재 시간대: ${timeOfDayLabel} (${hour}시)
맥락 가이드: ${timeContext}

현재 기온: ${Math.round(current.temperature_2m)}°C (오늘 최고 ${maxTemp}°C / 최저 ${minTemp}°C)
날씨 상태: ${info.label}
미세먼지: ${pm10Info.label} / 초미세먼지: ${pm25Info.label} / 자외선: ${uvInfo.label}
현재 강수 여부: ${current.precipitation > 0 ? '비 또는 눈 내리는 중' : '없음'}
오늘 중 비/눈 예보 여부: ${hasRainOrSnowLater ? '있음 (우산을 꼭 챙기도록 친근하게 조언해줘)' : '없음'}

규칙:
- 한 문장으로 매우 짧고 간결하게 작성할 것 (대략 30자 이내)
- 실용적인 조언(외투, 우산, 자외선차단제 등)을 자연스럽게 포함
- 이모지 사용 금지
- 반말 금지, 친근한 존댓말 사용
- 문장 부호로만 끝낼 것 (마침표 또는 느낌표)
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

    // 매 정각에 캐시가 만료되도록 동적 남은 시간(초) 계산
    const now = new Date();
    const minutes = now.getUTCMinutes();
    const seconds = now.getUTCSeconds();
    const secondsRemainingInHour = 3600 - (minutes * 60 + seconds);

    if (isAiSuccess) {
      res.setHeader('Cache-Control', `public, max-age=60, s-maxage=${secondsRemainingInHour}, stale-while-revalidate`);
    } else {
      // AI 요청이 실패한 경우, 캐시하지 않아 다음 요청 때 재시도를 즉시 유도함
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    }
    return res.status(200).json({
      temp: Math.round(current.temperature_2m),
      description: info.label,
      emoji: info.emoji,
      weatherCode: current.weather_code,
      message: aiMessage,
      isAiMessage: aiMessage !== info.message,
      hasPrecipitation: current.precipitation > 0,
      hourlyForecast,
      airQuality: {
        pm10: pm10Info,
        pm25: pm25Info,
        uv: uvInfo
      }
    });
  } catch (error) {
    console.error('Weather error:', error);
    return res.status(500).json({ error: 'Failed to fetch weather' });
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
