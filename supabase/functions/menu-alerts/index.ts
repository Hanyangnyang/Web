import { createClient } from 'npm:@supabase/supabase-js@2';
import admin from 'npm:firebase-admin@11.8.0';
import { jwtVerify } from 'npm:jose@5.1.3';

// 한국 표준시(KST) 상세 날짜/시간 정보를 신뢰할 수 있게 반환하는 헬퍼 함수
function getKSTDateDetails() {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  const parts = formatter.formatToParts(new Date());
  const partMap = Object.fromEntries(parts.map(p => [p.type, p.value]));
  
  // 오늘 날짜 형식: YYYY/MM/DD
  const todayDateStr = `${partMap.year}/${partMap.month}/${partMap.day}`;
  
  // 내일 날짜 계산
  const kstDate = new Date(`${partMap.year}-${partMap.month}-${partMap.day}T${partMap.hour}:${partMap.minute}:${partMap.second}+09:00`);
  const tomorrow = new Date(kstDate.getTime() + 24 * 60 * 60 * 1000);
  const tomorrowParts = formatter.formatToParts(tomorrow);
  const tomorrowPartMap = Object.fromEntries(tomorrowParts.map(p => [p.type, p.value]));
  
  const tomorrowDateStr = `${tomorrowPartMap.year}/${tomorrowPartMap.month}/${tomorrowPartMap.day}`;
  const tomorrowISODateStr = `${tomorrowPartMap.year}-${tomorrowPartMap.month}-${tomorrowPartMap.day}`;
  
  return {
    hourStr: partMap.hour,
    minuteStr: partMap.minute,
    todayDateStr,
    tomorrowDateStr,
    tomorrowISODateStr,
    dayOfWeek: kstDate.getDay() // 0 = 일요일, 1 = 월요일, ..., 6 = 토요일
  };
}

// 한국어 조사 처리 헬퍼 함수 (받침 유무 판별)
function getJosa(word: string, josaOptions: [string, string]) {
  if (!word) return josaOptions[0];
  const lastChar = word.charCodeAt(word.length - 1);
  // 한글(가~힣) 범위인지 확인
  if (lastChar >= 0xAC00 && lastChar <= 0xD7A3) {
    const hasJongseong = (lastChar - 0xAC00) % 28 > 0;
    return hasJongseong ? josaOptions[0] : josaOptions[1]; // [받침있을때, 받침없을때]
  }
  // 숫자로 끝나는 경우 (예: 1, 3, 6, 7, 8, 0 은 받침 소리가 남)
  if (/[013678]$/.test(word)) return josaOptions[0];
  if (/[2459]$/.test(word)) return josaOptions[1];
  
  // 영어 알파벳 등 기타 문자는 보통 괄호 처리하거나 '가'로 통일하지만, 
  // 식단 메뉴는 거의 한글이므로 기본적으로 받침 없다고 가정
  return josaOptions[1]; 
}

// 플랫폼에 대응하여 최적화된 FCM 메시지 페이로드를 조립하는 헬퍼 함수
function buildFCMMessage(token: string, platform: string, title: string, body: string, link: string) {
  const isWeb = platform === 'web';
  
  const message: any = {
    token: token,
    data: {
      title: title,
      body: body,
      link: link
    }
  };

  // Web (PWA) 플랫폼의 경우, 서비스워커(firebase-messaging-sw.js)의 onBackgroundMessage와
  // 브라우저 백그라운드 자동 노출 기능의 충돌로 인한 이중 알림(중복) 노출을 방지하기 위해 
  // 'notification' 속성을 제외한 'data-only' 메시지로 발송합니다.
  if (!isWeb) {
    message.notification = {
      title: title,
      body: body
    };
    message.apns = {
      headers: {
        'apns-push-type': 'alert',
        'apns-priority': '10'
      },
      payload: {
        aps: {
          sound: 'default',
          badge: 1
        }
      }
    };
    message.android = {
      priority: 'high',
      notification: {
        sound: 'default'
      }
    };
  }

  return message;
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } });
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
  // 보안 검증: jose 라이브러리를 사용해 토큰 서명의 유효성을 엄격하게 확인하고 service_role인지 인가합니다.
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Missing or invalid Authorization header' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const token = authHeader.split(' ')[1];
    // Supabase 프로젝트 고유의 JWT 비밀키 로드
    const jwtSecret = new TextEncoder().encode(Deno.env.get('SUPABASE_JWT_SECRET')!);

    // 🚨 서명 검증 및 해독 수행 (위조 토큰 전면 차단)
    const { payload } = await jwtVerify(token, jwtSecret);

    if (payload.role !== 'service_role') {
      console.warn('Unauthorized role attempted access:', payload.role);
      return new Response(JSON.stringify({ error: 'Forbidden: Requires service_role' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }
  } catch (error) {
    console.error('JWT signature verification failed:', error);
    return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token signature or expired' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }


  // Initialize Firebase (only once)
  if (!admin.apps.length) {
    try {
      const privateKey = Deno.env.get('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n');
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: Deno.env.get('VITE_FIREBASE_PROJECT_ID') || Deno.env.get('FIREBASE_PROJECT_ID'),
          clientEmail: Deno.env.get('CLIENT_EMAIL'),
          privateKey: privateKey,
        }),
      });
    } catch (error) {
      console.error('Firebase admin initialization error', error);
    }
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Get KST Time details
    const kst = getKSTDateDetails();

    // 2. Fetch active subscriptions (devices의 fcm_token과 platform을 함께 조인)
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('*, devices(fcm_token, platform)')
      .eq('is_active', true);

    if (subError) throw subError;
    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No active subscriptions' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // Filter subscriptions for current hour and minute
    const matchingSubscriptions = subscriptions.filter(sub => {
      const time = sub.params?.notifyTime || '08:00';
      const [sh, sm] = time.split(':');
      return sh === kst.hourStr && sm === kst.minuteStr;
    });

    if (matchingSubscriptions.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No subscriptions for this hour and minute' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // In Supabase Edge Functions, host is locked to production domain
    const host = 'hanyang.life';
    const protocol = 'https';

    const messages = [];
    const menuSentTokens = new Set();
    const weatherSentTokens = new Set();

    // --- A. 식단 알림(CAFETERIA_KEYWORD) 분할 및 처리 ---
    const menuSubs = matchingSubscriptions.filter(sub => sub.topic === 'CAFETERIA_KEYWORD');
    if (menuSubs.length > 0) {
      const todaySubs = menuSubs.filter(sub => (sub.params?.notifyDay || '당일') === '당일');
      const tomorrowSubs = menuSubs.filter(sub => sub.params?.notifyDay === '전날');

      const processGroup = (subs, menuData) => {
        if (!menuData || !menuData.data || !Array.isArray(menuData.data)) return;
        
        subs.forEach(sub => {
          const token = sub.devices?.fcm_token;
          const platform = sub.devices?.platform || 'web';
          if (!token || menuSentTokens.has(token)) return;

          const mode = sub.params?.mode || 'keyword';

          if (mode === 'cafe') {
            const targetCafeId = sub.params?.selectedCafe || 're12';
            const cafeObj = menuData.data.find(c => c && c.id === targetCafeId);
            if (cafeObj && cafeObj.available) {
              const dateParam = (menuData.date || '').replace(/\//g, '-');
              const deepLink = `${protocol}://${host}/?tab=cafe&date=${dateParam}&cafe=${targetCafeId}`;
              
              const isTomorrow = menuData.date !== kst.todayDateStr;
              const dayText = isTomorrow ? '내일' : '오늘';

              const lunchMenus = (cafeObj.menus || []).filter(m => m && m.type && typeof m.type === 'string' && m.type.includes('중식'));
              let bodyText = '';
              if (lunchMenus.length > 0) {
                const rawMenuText = lunchMenus[0].menu || '';
                const mainDish = rawMenuText
                  .split('\n')[0]
                  .trim()
                  .replace(/^[\*\-\s•]+/, '')
                  .replace(/<\/?[^>]+(>|$)/g, '');
                  
                const josa = getJosa(mainDish, ['이', '가']);
                if (lunchMenus.length > 1) {
                  bodyText = `${dayText} ${cafeObj.name}에는 ${mainDish} 외 ${lunchMenus.length - 1}개의 메뉴가 있어요`;
                } else {
                  bodyText = `${dayText} ${cafeObj.name}에는 ${mainDish}${josa} 나와요`;
                }
              } else {
                bodyText = `${dayText} ${cafeObj.name}의 맛있고 영양 가득한 식단을 확인해보세요!`;
              }

              const titleText = isTomorrow ? `내일의 학식 메뉴가 나왔어요!` : `오늘의 학식 메뉴가 나왔어요!`;

              const fcmMsg = buildFCMMessage(token, platform, titleText, bodyText, deepLink);
              messages.push(fcmMsg);
              menuSentTokens.add(token);
            }
          } else {
            // 키워드 모드
            const keywords = sub.params?.keywords || [];
            if (!keywords.length) return;

            let foundKeywords = [];
            const matchedCafes = [];
            let targetCafeId = '';
            let targetMealType = '';

            for (const cafe of menuData.data) {
              if (!cafe || !cafe.available) continue;
              let cafeMatched = false;
              for (const menuItem of (cafe.menus || [])) {
                if (!menuItem || !menuItem.menu || typeof menuItem.menu !== 'string') continue;
                if (keywords.some(kw => menuItem.menu.includes(kw))) {
                  const matchedInThisItem = keywords.filter(kw => menuItem.menu.includes(kw));
                  matchedInThisItem.forEach(kw => {
                    if (!foundKeywords.includes(kw)) foundKeywords.push(kw);
                  });

                  if (!targetCafeId) {
                    targetCafeId = cafe.id;
                    targetMealType = menuItem.type || '';
                  }
                  cafeMatched = true;
                }
              }
              if (cafeMatched) matchedCafes.push(cafe.name);
            }

            if (foundKeywords.length > 0) {
              const dateParam = (menuData.date || '').replace(/\//g, '-');
              const deepLink = `${protocol}://${host}/?tab=cafe&date=${dateParam}&cafe=${targetCafeId}&type=${encodeURIComponent(targetMealType)}`;
              const cafeInfo = matchedCafes.length > 1
                ? `${matchedCafes[0]} 등 ${matchedCafes.length}곳`
                : matchedCafes[0];

              const isTomorrow = menuData.date !== kst.todayDateStr;

              const bodyText = isTomorrow 
                ? `내일 ${cafeInfo}에 [${foundKeywords.join(', ')}] 메뉴가 있어요! 미리 확인해볼까요?`
                : `오늘 ${cafeInfo}에 [${foundKeywords.join(', ')}] 메뉴가 있어요! 얼른 확인해볼까요?`;

              const titleText = isTomorrow ? '📅 내일의 메뉴를 확인하세요!' : '🍔 기다리던 메뉴가 나왔어요!';
              
              const fcmMsg = buildFCMMessage(token, platform, titleText, bodyText, deepLink);
              messages.push(fcmMsg);
              menuSentTokens.add(token);
            }
          }
        });
      };

      // Process Today's Subscriptions
      if (todaySubs.length > 0) {
        try {
          const menuRes = await fetch(`${protocol}://${host}/api/menu`);
          const menuData = await menuRes.json();
          if (menuData.success) {
            processGroup(todaySubs, menuData);
          }
        } catch (e) {
          console.error("Today's menu fetch failed:", e);
        }
      }

      // Process Tomorrow's Subscriptions
      if (tomorrowSubs.length > 0) {
        try {
          const menuRes = await fetch(`${protocol}://${host}/api/menu?date=${kst.tomorrowISODateStr}`);
          const menuData = await menuRes.json();
          if (menuData.success) {
            processGroup(tomorrowSubs, menuData);
          }
        } catch (e) {
          console.error("Tomorrow's menu fetch failed:", e);
        }
      }
    }

    // --- B. 날씨 알림(WEATHER_ALERT) 처리 ---
    const weatherSubs = matchingSubscriptions.filter(sub => sub.topic === 'WEATHER_ALERT');
    if (weatherSubs.length > 0) {
      const [weatherRes, subwayRes] = await Promise.all([
        fetch(`${protocol}://${host}/api/portal?type=weather`),
        fetch(`${protocol}://${host}/api/subway`).then(r => r.ok ? r.json() : null).catch(() => null)
      ]);

      if (weatherRes.ok) {
        const weatherData = await weatherRes.ok ? await weatherRes.json() : null;
        if (weatherData) {
          const isHoliday = subwayRes?.isHoliday || false;
          const currentDay = kst.dayOfWeek;
          const isWeekday = currentDay >= 1 && currentDay <= 5 && !isHoliday;
          
          const hasRainOrSnow = weatherData.hasPrecipitation || (weatherData.hourlyForecast || []).some(h => {
            return h.hour >= 8 && h.hour <= 18 && (h.precipProb >= 30 || h.weatherCode >= 51);
          });

          const isDustBad = weatherData.airQuality?.pm10?.label === '나쁨' || 
                            weatherData.airQuality?.pm10?.label === '매우나쁨' ||
                            weatherData.airQuality?.pm25?.label === '나쁨' || 
                            weatherData.airQuality?.pm25?.label === '매우나쁨';

          const isUvHigh = weatherData.airQuality?.uv?.label === '높음' || 
                           weatherData.airQuality?.uv?.label === '매우높음';

          // 날씨 코드에 맞춰 브리핑 타이틀 이모지 동적 결정 (기본 '☀️' / 비오는 느낌의 '🌦️' 오해 방지)
          let briefingEmoji = '☀️';
          const weatherCode = weatherData.weatherCode;
          if (weatherCode !== undefined && weatherCode !== null) {
            if (weatherCode <= 0) briefingEmoji = '☀️';
            else if (weatherCode <= 1) briefingEmoji = '🌤️';
            else if (weatherCode <= 2) briefingEmoji = '⛅';
            else if (weatherCode <= 3) briefingEmoji = '☁️';
            else if (weatherCode <= 48) briefingEmoji = '🌫️';
            else if (weatherCode <= 67) briefingEmoji = '🌧️';
            else if (weatherCode <= 77) briefingEmoji = '❄️';
            else if (weatherCode <= 82) briefingEmoji = '🌦️';
            else briefingEmoji = '⛈️';
          }

          weatherSubs.forEach(sub => {
            const token = sub.devices?.fcm_token;
            const platform = sub.devices?.platform || 'web';
            if (!token || weatherSentTokens.has(token)) return;

            const cond = sub.params?.conditions || {};
            let shouldNotify = false;
            let title = `${briefingEmoji} 오늘 한양대 캠퍼스 날씨`;
            let body = '';

            if (cond.rainSnow && hasRainOrSnow) {
              shouldNotify = true;
              title = '☔ 캠퍼스에 비/눈 소식이 있어요!';
              body = '오늘 한양대 캠퍼스에 비나 눈 예보가 있습니다. 외출 시 꼭 우산을 챙기세요!';
            } else if (cond.dust && isDustBad) {
              shouldNotify = true;
              title = '😷 미세먼지가 나쁜 날입니다!';
              body = `오늘 캠퍼스 미세먼지가 ${weatherData.airQuality?.pm10?.label || '나쁨'} 단계입니다. 마스크를 잊지 마세요!`;
            } else if (cond.uv && isUvHigh) {
              shouldNotify = true;
              title = '☀️ 자외선 지수가 높은 날입니다!';
              body = '오늘 캠퍼스 자외선 강도가 높습니다. 외출 시 자외선 차단제와 선글라스를 챙기세요!';
            } else if (cond.daily || (cond.weekday && isWeekday)) {
              shouldNotify = true;
              title = `${briefingEmoji} 오늘의 캠퍼스 날씨 브리핑 (${weatherData.temp}°C)`;
              const comment = weatherData.message || `${weatherData.description} 상태입니다.`;
              body = comment;
            }

            if (shouldNotify && body) {
              const deepLink = `${protocol}://${host}/?tab=weather`;
              const fcmMsg = buildFCMMessage(token, platform, title, body, deepLink);
              messages.push(fcmMsg);
              weatherSentTokens.add(token);
            }
          });
        }
      }
    }

    // 4. Send Firebase Push Notifications in batches (max 500 per batch in parallel)
    if (messages.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No notifications triggered' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    console.info(`[FCM] 총 ${messages.length}개의 알림 메시지를 발송 시도합니다.`);

    const BATCH_SIZE = 500;
    let successCount = 0;
    let failureCount = 0;

    const batchPromises = [];
    for (let i = 0; i < messages.length; i += BATCH_SIZE) {
      const batch = messages.slice(i, i + BATCH_SIZE);
      batchPromises.push(admin.messaging().sendEach(batch));
    }

    const responses = await Promise.all(batchPromises);
    responses.forEach((response, batchIdx) => {
      successCount += response.successCount;
      failureCount += response.failureCount;

      // 발송에 실패한 메시지가 있을 경우 상세 로그 기록
      if (response.failureCount > 0) {
        console.warn(`[FCM Batch #${batchIdx + 1}] 발송 중 ${response.failureCount}건의 실패가 감지되었습니다.`);
        response.responses.forEach((res, resIdx) => {
          if (!res.success) {
            console.error(`[FCM Error] index: ${resIdx}, error:`, res.error);
          }
        });
      }
    });

    console.info(`[FCM Finished] 성공: ${successCount}건, 실패: ${failureCount}건`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Notifications sent. Success: ${successCount}, Failures: ${failureCount}`
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      }
    );

  } catch (error) {
    console.error('🚨 [Fatal Error] Cron job execution failed:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
});
