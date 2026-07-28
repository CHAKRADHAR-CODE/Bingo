import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Network, ConnectionStatus } from '@capacitor/network';
import { LocalNotifications } from '@capacitor/local-notifications';
import { StatusBar, Style } from '@capacitor/status-bar';

class NativeService {
  private isNative: boolean = false;

  constructor() {
    this.initNative();
  }

  private async initNative() {
    try {
      // Check if running inside Capacitor or Electron
      this.isNative = typeof (window as any).Capacitor !== 'undefined';
      if (this.isNative) {
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: '#070913' });
      }
    } catch (e) {
      // Graceful fallback for web/desktop
    }
  }

  // Tactile Haptic Vibration
  public async triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'success') {
    try {
      if (this.isNative) {
        if (type === 'light') {
          await Haptics.impact({ style: ImpactStyle.Light });
        } else if (type === 'medium') {
          await Haptics.impact({ style: ImpactStyle.Medium });
        } else if (type === 'heavy') {
          await Haptics.impact({ style: ImpactStyle.Heavy });
        } else if (type === 'success') {
          await Haptics.notification({ type: NotificationType.Success });
        }
      } else if ('vibrate' in navigator) {
        if (type === 'light') navigator.vibrate(15);
        else if (type === 'medium') navigator.vibrate(35);
        else if (type === 'heavy') navigator.vibrate(60);
        else if (type === 'success') navigator.vibrate([40, 60, 100]);
      }
    } catch (e) {
      // Ignore unsupported browser vibrate errors
    }
  }

  // Network Status Monitor
  public async listenNetworkStatus(callback: (status: ConnectionStatus) => void) {
    try {
      const status = await Network.getStatus();
      callback(status);

      Network.addListener('networkStatusChange', (s) => {
        callback(s);
      });
    } catch (e) {
      // Browser online/offline events fallback
      const update = () => callback({ connected: navigator.onLine, connectionType: 'wifi' });
      window.addEventListener('online', update);
      window.addEventListener('offline', update);
    }
  }

  // Local Push Notification
  public async sendNotification(title: string, body: string) {
    try {
      if (this.isNative) {
        await LocalNotifications.requestPermissions();
        await LocalNotifications.schedule({
          notifications: [
            {
              title,
              body,
              id: Math.floor(Math.random() * 100000),
              schedule: { at: new Date(Date.now() + 500) },
              sound: 'beep.wav',
            },
          ],
        });
      } else if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/favicon.png' });
      }
    } catch (e) {
      console.log('Notification unavailable:', e);
    }
  }
}

export const nativeService = new NativeService();
