import { createClient } from '@supabase/supabase-js';
import admin from 'firebase-admin';

// Initialize Supabase Admin Client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Initialize Firebase Admin (only once)
if (!admin.apps.length) {
  try {
    // If FIREBASE_PRIVATE_KEY contains literal \n, replace them with actual newlines
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.VITE_FIREBASE_PROJECT_ID,
        clientEmail: process.env.CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // 1. Get current hour in KST (Safe against different server/local timezones)
    const nowKST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
    const currentHourStr = nowKST.getHours().toString().padStart(2, '0'); // e.g. "08"

    // 2. Fetch active subscriptions with related device tokens (Menu & Weather)
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('*, devices(fcm_token)')
      .eq('is_active', true);

    if (subError) throw subError;
    if (!subscriptions || subscriptions.length === 0) {
      return res.status(200).json({ success: true, message: 'No active subscriptions' });
    }

    // Filter subscriptions for current hour
    const matchingSubscriptions = subscriptions.filter(sub => {
      const time = sub.params?.notifyTime || '08:00';
      return time.startsWith(currentHourStr + ':');
    });

    if (matchingSubscriptions.length === 0) {
      return res.status(200).json({ success: true, message: 'No subscriptions for this hour' });
    }

    const host = req.headers.host || 'hanyang.life';
    const protocol = host.includes('localhost') ? 'http' : 'https';

    const messages = [];
    const menuSentTokens = new Set();    // 식단 중복 발송 방지용
    const weatherSentTokens = new Set(); // 날씨 중복 발송 방지용

    // --- A. 식단 알림(CAFETERIA_KEYWORD) 분할 및 처리 ---
    const menuSubs = matchingSubscriptions.filter(sub => sub.topic === 'CAFETERIA_KEYWORD');
    if (menuSubs.length > 0) {
      const todaySubs = menuSubs.filter(sub => (sub.params?.notifyDay || '당일') === '당일');
      const tomorrowSubs = menuSubs.filter(sub => sub.params?.notifyDay === '전날');

      const processGroup = (subs, menuData) => {
        subs.forEach(sub => {
          const token = sub.devices?.fcm_token;
          if (!token || menuSentTokens.has(token)) return;

          const mode = sub.params?.mode || 'keyword';

          if (mode === 'cafe') {
            const targetCafeId = sub.params?.selectedCafe || 're12';
            const cafeObj = menuData.data.find(c => c.id === targetCafeId);
            if (cafeObj && cafeObj.available) {
              const dateParam = menuData.date.replace(/\//g, '-');
              const deepLink = `${protocol}://${host}/?tab=cafe&date=${dateParam}&cafe=${targetCafeId}`;
              
              const isTomorrow = menuData.date !== nowKST.toISOString().split('T')[0].replace(/-/g, '/');
              const dayText = isTomorrow ? '내일' : '오늘';

              // 중식 메뉴 추출
              const lunchMenus = (cafeObj.menus || []).filter(m => m.type.includes('중식'));
              let bodyText = '';
              if (lunchMenus.length > 0) {
                // 첫번째 메뉴의 첫째 줄(대표 메뉴)
                const mainDish = lunchMenus[0].menu.split('\n')[0].trim().replace(/^[\*\-\s]+/, ''); // 마크다운 기호 제거
                if (lunchMenus.length > 1) {
                  bodyText = `${dayText} ${cafeObj.name}에는 ${mainDish} 외 ${lunchMenus.length - 1}개의 메뉴가 있어요`;
                } else {
                  bodyText = `${dayText} ${cafeObj.name}에는 ${mainDish}가 나와요`;
                }
              } else {
                bodyText = `${dayText} ${cafeObj.name}의 맛있고 영양 가득한 식단을 확인해보세요!`;
              }

              const titleText = isTomorrow ? `내일의 학식 메뉴가 나왔어요!` : `오늘의 학식 메뉴가 나왔어요!`;

              messages.push({
                token: token,
                data: {
                  title: titleText,
                  body: bodyText,
                  link: deepLink
                },
                apns: {
                  payload: {
                    aps: {
                      alert: {
                        title: titleText,
                        body: bodyText
                      },
                      sound: 'default'
                    }
                  }
                },
                android: {
                  notification: {
                    title: titleText,
                    body: bodyText
                  }
                }
              });
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
              if (!cafe.available) continue;
              let cafeMatched = false;
              for (const menuItem of cafe.menus) {
                if (keywords.some(kw => menuItem.menu.includes(kw))) {
                  const matchedInThisItem = keywords.filter(kw => menuItem.menu.includes(kw));
                  matchedInThisItem.forEach(kw => {
                    if (!foundKeywords.includes(kw)) foundKeywords.push(kw);
                  });

                  if (!targetCafeId) {
                    targetCafeId = cafe.id;
                    targetMealType = menuItem.type;
                  }
                  cafeMatched = true;
                }
              }
              if (cafeMatched) matchedCafes.push(cafe.name);
            }

            if (foundKeywords.length > 0) {
              const dateParam = menuData.date.replace(/\//g, '-');
              const deepLink = `${protocol}://${host}/?tab=cafe&date=${dateParam}&cafe=${targetCafeId}&type=${encodeURIComponent(targetMealType)}`;
              const cafeInfo = matchedCafes.length > 1
                ? `${matchedCafes[0]} 등 ${matchedCafes.length}곳`
                : matchedCafes[0];

              const isTomorrow = menuData.date !== nowKST.toISOString().split('T')[0].replace(/-/g, '/');

              const bodyText = isTomorrow 
                ? `내일 ${cafeInfo}에 [${foundKeywords.join(', ')}] 메뉴가 있어요! 미리 확인해볼까요?`
                : `오늘 ${cafeInfo}에 [${foundKeywords.join(', ')}] 메뉴가 있어요! 얼른 확인해볼까요?`;

              const titleText = isTomorrow ? '📅 내일의 메뉴를 확인하세요!' : '🍔 기다리던 메뉴가 나왔어요!';
              messages.push({
                token: token,
                data: {
                  title: titleText,
                  body: bodyText,
                  link: deepLink
                },
                apns: {
                  payload: {
                    aps: {
                      alert: {
                        title: titleText,
                        body: bodyText
                      },
                      sound: 'default'
                    }
                  }
                },
                android: {
                  notification: {
                    title: titleText,
                    body: bodyText
                  }
                }
              });
              menuSentTokens.add(token);
            }
          }
        });
      };

      // Process Today's Subscriptions
      if (todaySubs.length > 0) {
        const menuRes = await fetch(`${protocol}://${host}/api/menu`);
        const menuData = await menuRes.json();
        if (menuData.success) processGroup(todaySubs, menuData);
      }

      // Process Tomorrow's Subscriptions
      if (tomorrowSubs.length > 0) {
        const tomorrow = new Date(nowKST.getTime() + 24 * 60 * 60 * 1000);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        const menuRes = await fetch(`${protocol}://${host}/api/menu?date=${tomorrowStr}`);
        const menuData = await menuRes.json();
        if (menuData.success) processGroup(tomorrowSubs, menuData);
      }
    }

    // --- B. 날씨 알림(WEATHER_ALERT) 처리 ---
    const weatherSubs = matchingSubscriptions.filter(sub => sub.topic === 'WEATHER_ALERT');
    if (weatherSubs.length > 0) {
      // 1. 날씨 데이터와 지하철 공휴일 판단용 데이터 병렬로 긁어오기
      const [weatherRes, subwayRes] = await Promise.all([
        fetch(`${protocol}://${host}/api/portal?type=weather`),
        fetch(`${protocol}://${host}/api/subway`).then(r => r.ok ? r.json() : null).catch(() => null)
      ]);

      if (weatherRes.ok) {
        const weatherData = await weatherRes.json();
        const isHoliday = subwayRes?.isHoliday || false;
        const currentDay = nowKST.getDay();
        const isWeekday = currentDay >= 1 && currentDay <= 5 && !isHoliday;
        
        // 날씨 파라미터 판단 가드 설정
        const hasRainOrSnow = weatherData.hasPrecipitation || (weatherData.hourlyForecast || []).some(h => {
          // 낮 시간대(8시 ~ 18시) 강수 확률 30% 이상이거나 비/눈 상태코드 검출
          return h.hour >= 8 && h.hour <= 18 && (h.precipProb >= 30 || h.weatherCode >= 51);
        });

        const isDustBad = weatherData.airQuality?.pm10?.label === '나쁨' || 
                          weatherData.airQuality?.pm10?.label === '매우나쁨' ||
                          weatherData.airQuality?.pm25?.label === '나쁨' || 
                          weatherData.airQuality?.pm25?.label === '매우나쁨';

        const isUvHigh = weatherData.airQuality?.uv?.label === '높음' || 
                         weatherData.airQuality?.uv?.label === '매우높음';

        weatherSubs.forEach(sub => {
          const token = sub.devices?.fcm_token;
          if (!token || weatherSentTokens.has(token)) return;

          const cond = sub.params?.conditions || {};
          let shouldNotify = false;
          let title = '🌦️ 오늘 한양대 캠퍼스 날씨';
          let body = '';

          // 1순위: 기상 악화 경보 (비/눈, 미세먼지, 자외선)
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
            // 2순위: 매일/평일 브리핑 신청자
            shouldNotify = true;
            title = `🌦️ 오늘의 캠퍼스 날씨 브리핑 (${weatherData.temp}°C)`;
            
            // Gemini 코멘트가 제공되었다면 붙이고, 없으면 기본 날씨 묘사 사용
            const comment = weatherData.message || `${weatherData.description} 상태입니다.`;
            body = comment;
          }

          if (shouldNotify && body) {
            const deepLink = `${protocol}://${host}/?tab=weather`;
            messages.push({
              token: token,
              data: {
                title: title,
                body: body,
                link: deepLink
              },
              apns: {
                payload: {
                  aps: {
                    alert: {
                      title: title,
                      body: body
                    },
                    sound: 'default'
                  }
                }
              },
              android: {
                notification: {
                  title: title,
                  body: body
                }
              }
            });
            weatherSentTokens.add(token);
          }
        });
      }
    }

    // 4. Send Firebase Push Notifications in batches (max 500 per batch)
    if (messages.length === 0) {
      return res.status(200).json({ success: true, message: 'No notifications triggered' });
    }

    const BATCH_SIZE = 500;
    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < messages.length; i += BATCH_SIZE) {
      const batch = messages.slice(i, i + BATCH_SIZE);
      const response = await admin.messaging().sendEach(batch);
      successCount += response.successCount;
      failureCount += response.failureCount;
    }

    return res.status(200).json({
      success: true,
      message: `Notifications sent. Success: ${successCount}, Failures: ${failureCount}`
    });

  } catch (error) {
    console.error('Cron job error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
