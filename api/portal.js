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
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code&timezone=Asia%2FSeoul&models=icon_seamless`),
      fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm10,pm2_5,uv_index&timezone=Asia%2FSeoul`)
    ]);

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

    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate');
    return res.status(200).json({
      temp: Math.round(current.temperature_2m),
      description: info.label,
      emoji: info.emoji,
      weatherCode: current.weather_code,
      message: info.message,
      hasPrecipitation: current.precipitation > 0,
      airQuality: {
        pm10: getAQILabel(air.pm10, 'pm10'),
        pm25: getAQILabel(air.pm2_5, 'pm25'),
        uv: getAQILabel(air.uv_index, 'uv')
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
