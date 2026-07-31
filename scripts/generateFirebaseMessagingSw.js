import { writeFileSync } from 'node:fs';
import path from 'node:path';

const OUTPUT_PATH = path.resolve(process.cwd(), 'public/firebase-messaging-sw.js');

// public/firebase-messaging-sw.js는 Service Worker라 import.meta.env를 못 읽어서,
// firebaseConfig 값을 여기 손으로도 하드코딩해야 했음 — src/lib/firebase.ts와 값이
// 어긋날 위험(Firebase 프로젝트 교체/키 로테이션 시 한쪽만 고치고 잊어버리는 경우)이 있었음.
// 그래서 같은 .env(VITE_FIREBASE_*)를 유일한 출처로 삼아 dev 서버 시작·빌드 시마다 이 파일을 새로 생성한다.
export function generateFirebaseMessagingSw(env) {
  const firebaseConfig = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
  };

  const content = `// 이 파일은 자동 생성됩니다 — scripts/generateFirebaseMessagingSw.js가 dev/build 시마다 새로 씁니다.
// 직접 수정하지 말고 .env의 VITE_FIREBASE_* 값을 바꾼 뒤 dev 서버를 재시작하거나 다시 빌드하세요.
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

const firebaseConfig = ${JSON.stringify(firebaseConfig, null, 2)};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  // notification 필드 대신 data 필드에서 정보를 가져옴
  const notificationTitle = payload.data?.title || '하냥냥 학식 알림';
  const notificationOptions = {
    body: payload.data?.body || '등록하신 키워드의 메뉴가 나왔어요!',
    icon: '/icon-192x192.png',
    data: {
      url: payload.data?.link // 클릭 시 이동할 URL 저장
    }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// 알림 클릭 이벤트 핸들러 추가
self.addEventListener('notificationclick', function(event) {
  event.notification.close(); // 알림 닫기

  const urlToOpen = event.notification.data?.url;

  if (urlToOpen) {
    // 백그라운드에서 알림을 클릭했을 때 해당 URL로 이동
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
        // 이미 앱이 열려있는 탭이 있다면 그 탭을 포커스하고 URL 이동
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i];
          if (client.url.includes(self.registration.scope) && 'focus' in client) {
            return client.focus().then(() => client.navigate(urlToOpen));
          }
        }
        // 열려있는 앱 탭이 없다면 새 창 열기
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
    );
  }
});
`;

  writeFileSync(OUTPUT_PATH, content, 'utf-8');
}
