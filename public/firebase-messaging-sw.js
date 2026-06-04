importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyDKLyhe1GIcf00pZAVeqB3qveqNKhTcsFs",
  projectId: "ha-nyang-nyang",
  messagingSenderId: "332911939460",
  appId: "1:332911939460:web:a31fab4e45caf457d717d1"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  // notification 필드 대신 data 필드에서 정보를 가져옴
  const notificationTitle = payload.data?.title || '한양냥 식단 알림';
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
          // self.registration.scope가 커스텀 서브스코프로 설정되어 있어도 실제 웹앱 origin 기준의 열린 창을 찾도록 변경합니다.
          if (client.url.startsWith(self.location.origin) && 'focus' in client) {
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
