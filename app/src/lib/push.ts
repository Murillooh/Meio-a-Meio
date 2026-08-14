import { supabase } from './supabase';

export function urlB64ToUint8Array(base64String: string) {
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

export async function subscribeToPush(userId: string, householdId: string) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Notificações Push não são suportadas neste navegador.');
  }

  const registration = await navigator.serviceWorker.ready;

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    const publicVapidKey = import.meta.env.VITE_PUBLIC_VAPID_KEY;
    if (!publicVapidKey) {
      throw new Error('VAPID key não configurada');
    }
    
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlB64ToUint8Array(publicVapidKey)
    });
  }

  const subJson = subscription.toJSON();
  if (!subJson.keys) {
      throw new Error("Subscription keys missing");
  }

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert({
      user_id: userId,
      household_id: householdId,
      endpoint: subscription.endpoint,
      auth: subJson.keys.auth,
      p256dh: subJson.keys.p256dh
    }, { onConflict: 'user_id, endpoint' });

  if (error) throw error;
  
  return true;
}

export async function unsubscribeFromPush(userId: string) {
  if (!('serviceWorker' in navigator)) return;
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  
  if (subscription) {
    await supabase.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint).eq('user_id', userId);
    await subscription.unsubscribe();
  }
}

export async function getPushSubscriptionStatus() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return false;
  }
  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) return false;
  const subscription = await registration.pushManager.getSubscription();
  return !!subscription;
}
