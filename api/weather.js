// Vercel Serverless Function: Weather & Air Quality API Proxy (Open-Meteo Version)
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const LAT = 37.297; // 한양대 에리카 좌표
  const LNG = 126.834;

  try {
    // 1. 날씨 및 강수 예보 호출 (Open-Meteo)
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LNG}&current=temperature_2m,weather_code&hourly=weather_code&timezone=Asia%2FSeoul&forecast_days=2`;
    
    // 2. 대기질 및 자외선 호출 (Open-Meteo Air Quality)
    const airUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${LAT}&longitude=${LNG}&current=pm10,pm2_5,uv_index&timezone=Asia%2FSeoul`;

    const [weatherRes, airRes] = await Promise.all([
      fetch(weatherUrl),
      fetch(airUrl)
    ]);

    const weatherData = await weatherRes.json();
    const airData = await airRes.json();

    const currentTemp = Math.round(weatherData.current.temperature_2m);
    const weatherCode = weatherData.current.weather_code;
    const pm10 = Math.round(airData.current.pm10);
    const pm25 = Math.round(airData.current.pm2_5);
    const uvIndex = Math.round(airData.current.uv_index);

    // 향후 12시간 내 비/눈 예보 확인
    const currentHour = new Date().getHours();
    const upcomingWeatherCodes = weatherData.hourly.weather_code.slice(currentHour, currentHour + 12);
    
    let precipType = null;
    let precipTime = null;
    
    for (let i = 0; i < upcomingWeatherCodes.length; i++) {
      const code = upcomingWeatherCodes[i];
      if ([71, 73, 75, 77, 85, 86].includes(code)) {
        precipType = 'snow'; precipTime = currentHour + i; break;
      } else if ([51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99].includes(code)) {
        precipType = 'rain'; precipTime = currentHour + i; break;
      }
    }

    if (precipTime >= 24) precipTime -= 24; // 24시 넘어가면 새벽으로 표기

    const processedData = {
      temp: currentTemp,
      description: getKoreanWeatherDesc(weatherCode),
      message: generateWeatherMessage(weatherCode, currentTemp, precipType, precipTime),
      hasPrecipitation: !!precipType,
      airQuality: {
        pm10: { value: pm10, ...getKoreanPm10Status(pm10) },
        pm25: { value: pm25, ...getKoreanPm25Status(pm25) },
        uv: { value: uvIndex, ...getKoreanUvStatus(uvIndex) }
      },
      updatedAt: Date.now()
    };

    return res.status(200).json(processedData);
  } catch (error) {
    console.error('Open-Meteo fetch error:', error);
    return res.status(500).json({ error: 'Weather fetch failed' });
  }
}

// 💡 WMO 코드를 완벽한 한국어로 매핑 (네이버 날씨와 유사한 표준 명칭)
function getKoreanWeatherDesc(code) {
  if (code === 0) return '맑음';
  if (code === 1 || code === 2) return '구름 조금';
  if (code === 3) return '흐림';
  if ([45, 48].includes(code)) return '안개';
  if ([51, 53, 55, 56, 57].includes(code)) return '이슬비';
  if ([61, 63, 65, 66, 67].includes(code)) return '비';
  if ([71, 73, 75, 77].includes(code)) return '눈';
  if ([80, 81, 82].includes(code)) return '소나기';
  if ([85, 86].includes(code)) return '눈보라';
  if ([95, 96, 99].includes(code)) return '천둥번개';
  return '알 수 없음';
}

// 💡 한국 환경부(에어코리아) 미세먼지 기준 적용
function getKoreanPm10Status(val) {
  if (val <= 30) return { label: '좋음', color: '#3b82f6' };
  if (val <= 80) return { label: '보통', color: '#22c55e' };
  if (val <= 150) return { label: '나쁨', color: '#f59e0b' };
  return { label: '매우나쁨', color: '#ef4444' };
}

// 💡 한국 환경부(에어코리아) 초미세먼지 기준 적용
function getKoreanPm25Status(val) {
  if (val <= 15) return { label: '좋음', color: '#3b82f6' };
  if (val <= 35) return { label: '보통', color: '#22c55e' };
  if (val <= 75) return { label: '나쁨', color: '#f59e0b' };
  return { label: '매우나쁨', color: '#ef4444' };
}

function getKoreanUvStatus(val) {
  if (val <= 2) return { label: '낮음', color: '#3b82f6' };
  if (val <= 5) return { label: '보통', color: '#22c55e' };
  if (val <= 7) return { label: '높음', color: '#f59e0b' };
  if (val <= 10) return { label: '매우높음', color: '#ef4444' };
  return { label: '위험', color: '#991b1b' };
}

// 멘트도 날씨 코드 기반으로 자연스럽게 수정
function generateWeatherMessage(code, temp, precipType, precipTime) {
  const rand = Math.floor(Math.random() * 3);
  
  if (precipType === 'snow') return [`오늘 ${precipTime}시경에 눈 소식이 있습니다.`, `${precipTime}시쯤부터 눈이 내릴 것으로 예상됩니다.`, `오후 ${precipTime}시경 눈 예보가 있습니다.`][rand];
  if (precipType === 'rain') return [`오늘 ${precipTime}시경부터 비 소식이 있습니다. 우산을 챙기세요!`, `${precipTime}시쯤 비가 시작될 것으로 보입니다.`, `오늘 ${precipTime}시경에 비가 예보되어 있습니다.`][rand];
  if (temp <= 0) return ["날씨가 꽤 춥습니다. 옷을 든든하게 입으세요.", "바람이 차갑습니다. 따뜻하게 입고 외출하세요.", "추운 날씨입니다. 감기 조심하세요!"][rand];
  if (temp >= 28) return ["날씨가 덥습니다. 무더위에 지치지 않게 조심하세요.", "폭염이 예상됩니다. 수분을 자주 섭취하세요.", "햇빛이 강합니다. 시원하게 입고 외출하세요!"][rand];
  
  if (code === 3) return ["하늘에 구름이 많고 흐린 날씨입니다.", "구름이 해를 가려 어둑한 날씨가 이어집니다.", "오늘은 전반적으로 구름 많은 날씨가 예상됩니다."][rand];
  
  return ["오늘은 맑고 화창한 날씨입니다! 기분 좋게 출발하세요.", "구름 없이 맑은 날씨입니다. 산책하기 좋겠네요.", "현재 쾌청한 날씨를 보이고 있습니다."][rand];
}
