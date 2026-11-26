import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";
import { getRemoteConfig } from "firebase/remote-config";
import { getAI, GoogleAIBackend } from "firebase/ai";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// 1. تهيئة التطبيق الأساسي
export const app = initializeApp(firebaseConfig);

// 2. تفعيل المصادقة (Authentication) ومزود الدخول بجوجل
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// 3. تفعيل الإعداد عن بُعد (Remote Config)
export const remoteConfig = getRemoteConfig(app);
remoteConfig.settings.minimumFetchIntervalMillis = 3600000;

// 4. تفعيل الذكاء الاصطناعي (Firebase AI Logic)
export const ai = getAI(app, { backend: new GoogleAIBackend() });

// 5. دالة جاهزة لطلب إذن الإشعارات وجلب التوكن الخاص بالمستخدم
export const requestNotificationToken = async (): Promise<string | null> => {
  try {
    const supported = await isSupported();
    if (!supported) return null;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    });
    return token || null;
  } catch (error) {
    console.error("فشل جلب توكن الإشعارات:", error);
    return null;
  }
};

// 6. الاستماع للإشعارات والموقع مفتوح أمام المستخدم
export const onForegroundMessage = async (callback: (payload: unknown) => void) => {
  const supported = await isSupported();
  if (!supported) return;
  const messaging = getMessaging(app);
  onMessage(messaging, callback);
};
