import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

export function usePushNotifications() {
  const [permission, setPermission] = useState(Notification.permission);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  useEffect(() => {
    // Just check for existing subscription on mount
    const checkSubscription = async () => {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        const sub = await registration.pushManager.getSubscription();
        setSubscription(sub);
      }
    };
    checkSubscription();
  }, []);

  const subscribeToPush = async () => {
    if (!VAPID_PUBLIC_KEY) {
      console.warn('Missing VITE_VAPID_PUBLIC_KEY');
      toast.error('Push notifications not configured (Missing Key)');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });
      
      setSubscription(sub);
      await sendSubscriptionToBackend(sub);
      toast.success('Notifications enabled!');
      return true;
    } catch (error) {
      console.error('Failed to subscribe:', error);
      toast.error('Failed to enable notifications');
      return false;
    }
  };

  const sendSubscriptionToBackend = async (sub: PushSubscription) => {
    await apiFetch('/notifications/subscribe', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(sub)
    });
  };

  return { permission, subscribeToPush, subscription };
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
