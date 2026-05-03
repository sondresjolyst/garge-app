import axiosInstance from '@/services/axiosInstance';

function urlBase64ToUint8Array(base64: string): Uint8Array {
    const padding = '='.repeat((4 - (base64.length % 4)) % 4);
    const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw = atob(b64);
    return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

export function isPushSupported(): boolean {
    return typeof window !== 'undefined' &&
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window;
}

export async function getVapidPublicKey(): Promise<string> {
    const res = await axiosInstance.get<{ publicKey: string }>('/push-subscriptions/vapid-public-key');
    return res.data.publicKey;
}

export async function subscribeToPush(): Promise<void> {
    if (!isPushSupported()) throw new Error('Push not supported in this browser');

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') throw new Error('Notification permission denied');

    const publicKey = await getVapidPublicKey();
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
    });

    const key = sub.getKey('p256dh');
    const auth = sub.getKey('auth');

    await axiosInstance.post('/push-subscriptions', {
        endpoint: sub.endpoint,
        p256dh: key ? btoa(String.fromCharCode(...new Uint8Array(key))) : '',
        auth: auth ? btoa(String.fromCharCode(...new Uint8Array(auth))) : '',
    });
}

export async function unsubscribeFromPush(): Promise<void> {
    if (!isPushSupported()) return;
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return;
    const endpoint = sub.endpoint;
    await sub.unsubscribe();
    await axiosInstance.delete('/push-subscriptions', { data: { endpoint } });
}

export async function sendTestNotification(): Promise<void> {
    await axiosInstance.post('/push-subscriptions/send-test');
}

export async function isPushSubscribed(): Promise<boolean> {
    if (!isPushSupported()) return false;
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    return sub !== null;
}
