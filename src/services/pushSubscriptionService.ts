// src/services/pushSubscriptionService.ts

// Set your VAPID public key here (copy from backend .env)
const VAPID_PUBLIC_KEY = 'BE7zPj42_92a4ZYh8DbnjeZtqxVh18GpidpT7evKP_hcWr5BQlqITbnnqfDRuMA8rzQYmpi5kTblYbuz_Sai2Lc';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeUserToPush(token: string): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    alert('Push notifications are not supported in this browser.');
    return null;
  }

  const registration = await navigator.serviceWorker.ready;

  // Request notification permission
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    alert('Notification permission denied.');
    return null;
  }

  // Subscribe to push
  const convertedVapidKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: convertedVapidKey,
  });

  // Send subscription to Django backend
  const subJSON = subscription.toJSON();
  await fetch('/api/push-subscriptions/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subJSON.keys?.p256dh || '',
        auth: subJSON.keys?.auth || '',
      },
    }),
  });

  return subscription;
} 