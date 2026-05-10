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

    // 3. Fetch today's menu
    // Assuming the app is deployed to hanyang.life, or fallback to it
    const host = req.headers.host || 'hanyang.life';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const menuRes = await fetch(`${protocol}://${host}/api/menu`);
    const menuData = await menuRes.json();

    if (!menuData.success) {
      throw new Error('Failed to fetch menu');
    }

    // Prepare notifications
    const messages = [];

    matchingSubscriptions.forEach(sub => {
      const keywords = sub.params?.keywords || [];
      const token = sub.devices?.fcm_token;

      if (!keywords.length || !token) return;

      // Find if any keyword exists in today's menu
      let foundKeywords = [];
      menuData.data.forEach(cafe => {
        if (!cafe.available) return;
        cafe.menus.forEach(menuItem => {
          keywords.forEach(kw => {
            if (menuItem.menu.includes(kw) && !foundKeywords.includes(kw)) {
              foundKeywords.push(kw);
            }
          });
        });
      });

      if (foundKeywords.length > 0) {
        messages.push({
          token: token,
          notification: {
            title: '🍔 기다리던 학식 메뉴가 나왔어요!',
            body: `오늘 식단에 [${foundKeywords.join(', ')}] 메뉴가 포함되어 있습니다. 앱에서 확인해보세요!`,
          },
          webpush: {
            fcmOptions: {
              link: 'https://hanyang.life'
            }
          }
        });
      }
    });

    if (messages.length === 0) {
      return res.status(200).json({ success: true, message: 'No matching keywords for current hour' });
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
