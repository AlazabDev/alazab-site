importScripts('https://gstatic.com');
importScripts('https://gstatic.com');

firebase.initializeApp({
  apiKey: "ضع_هنا_الـ_API_KEY_الخاص_بك",
  authDomain: "://firebaseapp.com",
  projectId: "al-azab-architect",
  storageBucket: "al-azab-architect.firebasestorage.app",
  messagingSenderId: "93032397237",
  appId: "1:93032397237:web:0663cb8232b77a9f3b01fc"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'إشعار جديد';
  const options = {
    body: payload.notification?.body || '',
    icon: '/favicon.ico'
  };
  self.registration.showNotification(title, options);
});
