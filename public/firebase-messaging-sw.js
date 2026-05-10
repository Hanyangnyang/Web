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
  const notificationTitle = payload?.notification?.title || '한양냥 식단 알림';
  const notificationOptions = {
    body: payload?.notification?.body || '등록하신 키워드의 메뉴가 나왔어요!',
    icon: '/icon-192x192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
