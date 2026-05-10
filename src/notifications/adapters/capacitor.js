import { buildBatch, notificationIdFor } from '../schedule.js';

const CHANNEL_ID = 'hourly-tick';
let LocalNotifications;
let App;
let appListenerBound = false;

async function loadPlugins() {
  if (!LocalNotifications) {
    ({ LocalNotifications } = await import('@capacitor/local-notifications'));
  }
  if (!App) {
    ({ App } = await import('@capacitor/app'));
  }
}

export const capacitorAdapter = {
  async requestPermission() {
    await loadPlugins();
    const res = await LocalNotifications.requestPermissions();
    return res.display === 'granted' ? 'granted' : 'denied';
  },

  async cancelAll() {
    await loadPlugins();
    const pending = await LocalNotifications.getPending();
    if (pending.notifications?.length) {
      await LocalNotifications.cancel({ notifications: pending.notifications });
    }
  },

  async applySchedule(settings) {
    await loadPlugins();

    try {
      await LocalNotifications.createChannel({
        id: CHANNEL_ID,
        name: 'Hourly check-in',
        description: 'Hourly memo reminders',
        importance: 3,
        visibility: 1
      });
    } catch {}

    await this.cancelAll();
    if (!settings.enabled) return;

    const perms = await LocalNotifications.checkPermissions();
    if (perms.display !== 'granted') return;

    const fireTimes = buildBatch(new Date(), settings, 24);
    const notifications = fireTimes.map(t => ({
      id: notificationIdFor(t),
      title: 'Hourly',
      body: settings.message || 'Hourly check-in',
      schedule: { at: t, allowWhileIdle: true },
      channelId: CHANNEL_ID
    }));

    if (notifications.length) {
      await LocalNotifications.schedule({ notifications });
    }

    if (!appListenerBound) {
      appListenerBound = true;
      App.addListener('appStateChange', ({ isActive }) => {
        if (isActive) {
          this.applySchedule(settings).catch(() => {});
        }
      });
    }
  }
};
