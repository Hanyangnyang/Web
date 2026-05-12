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
    // 1. Get current hour in KST
    const nowKST = new Date(new Date().getTime() + 9 * 60 * 60 * 1000);
    const currentHourStr = nowKST.getHours().toString().padStart(2, '0'); // e.g. "08"

    // 2. Fetch active subscriptions with related device tokens
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

    // 3. Prepare notifications
    const messages = [];
    const sentTokens = new Set(); // 중복 발송 방지용

    // Group subscriptions by target date
    const todaySubs = matchingSubscriptions.filter(sub => (sub.params?.notifyDay || '당일') === '당일');
    const tomorrowSubs = matchingSubscriptions.filter(sub => sub.params?.notifyDay === '전날');

    const host = req.headers.host || 'hanyang.life';
    const protocol = host.includes('localhost') ? 'http' : 'https';

    // Helper to process a group of subscriptions with a specific menu
    const processGroup = (subs, menuData) => {
      subs.forEach(sub => {
        const keywords = sub.params?.keywords || [];
        const token = sub.devices?.fcm_token;

        if (!keywords.length || !token || sentTokens.has(token)) return;

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
          const deepLink = `https://${host}/?tab=cafe&date=${dateParam}&cafe=${targetCafeId}&type=${encodeURIComponent(targetMealType)}`;
          const cafeInfo = matchedCafes.length > 1
            ? `${matchedCafes[0]} 등 ${matchedCafes.length}곳`
            : matchedCafes[0];

          const isTomorrow = menuData.date !== nowKST.toISOString().split('T')[0].replace(/-/g, '/');

          messages.push({
            token: token,
            notification: {
              title: isTomorrow ? '📅 내일의 메뉴를 확인하세요!' : '🍔 기다리던 메뉴가 나왔어요!',
              body: `내일 ${cafeInfo}에 [${foundKeywords.join(', ')}] 메뉴가 있어요! 미리 확인해볼까요?`,
            },
            webpush: {
              fcmOptions: {
                link: deepLink
              }
            }
          });

          // update body if it's today
          if (!isTomorrow) {
            messages[messages.length - 1].notification.body = `오늘 ${cafeInfo}에 [${foundKeywords.join(', ')}] 메뉴가 있어요! 얼른 확인해볼까요?`;
          }

          sentTokens.add(token);
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

    if (messages.length === 0) {
      return res.status(200).json({ success: true, message: 'No matching keywords found' });
    }

    // 4. Send Firebase Push Notifications in batches (max 500 per batch)
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
