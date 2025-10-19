import { useState, useEffect } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';

export function NotificationManager() {
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
      checkSubscription();
    }
  }, []);

  const checkSubscription = async () => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(subscription !== null);
      } catch (error) {
        console.error('Error checking subscription:', error);
      }
    }
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('المتصفح لا يدعم الإشعارات');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);

      if (permission === 'granted') {
        toast.success('تم تفعيل الإشعارات بنجاح!');
        await subscribeToNotifications();
      } else if (permission === 'denied') {
        toast.error('تم رفض أذونات الإشعارات');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast.error('حدث خطأ في طلب أذونات الإشعارات');
    }
  };

  const subscribeToNotifications = async () => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U'
          )
        });

        console.log('Push subscription:', subscription);
        setIsSubscribed(true);
        
      } catch (error) {
        console.error('Error subscribing to push notifications:', error);
        toast.error('فشل الاشتراك في الإشعارات');
      }
    }
  };

  const sendTestNotification = () => {
    if (notificationPermission === 'granted') {
      new Notification('منصة الخصومات', {
        body: 'هذا إشعار تجريبي! لديك عرض جديد متاح 🎉',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: 'test-notification',
        requireInteraction: false
      } as NotificationOptions);
      
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
      
      toast.success('تم إرسال إشعار تجريبي');
    } else {
      toast.error('يجب تفعيل الإشعارات أولاً');
    }
  };

  const unsubscribeFromNotifications = async () => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        
        if (subscription) {
          await subscription.unsubscribe();
          setIsSubscribed(false);
          toast.success('تم إلغاء الاشتراك في الإشعارات');
        }
      } catch (error) {
        console.error('Error unsubscribing:', error);
        toast.error('فشل إلغاء الاشتراك');
      }
    }
  };

  return (
    <div className="flex items-center gap-2">
      {notificationPermission === 'granted' ? (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={sendTestNotification}
            className="gap-2"
          >
            <Bell className="h-4 w-4" />
            إرسال إشعار تجريبي
          </Button>
          {isSubscribed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={unsubscribeFromNotifications}
            >
              <BellOff className="h-4 w-4" />
            </Button>
          )}
        </>
      ) : (
        <Button
          variant="default"
          size="sm"
          onClick={requestNotificationPermission}
          className="gap-2"
        >
          <Bell className="h-4 w-4" />
          تفعيل الإشعارات
        </Button>
      )}
    </div>
  );
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
