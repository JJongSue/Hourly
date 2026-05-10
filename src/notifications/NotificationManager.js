import { getNotificationSettings, setNotificationSettings } from '../storage.js';

let adapter = null;

function detectPlatform() {
  if (typeof window === 'undefined') return 'web';
  if (window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform()) {
    return 'capacitor';
  }
  if (window.hourlyBridge) return 'electron';
  return 'web';
}

async function loadAdapter() {
  if (adapter) return adapter;
  const platform = detectPlatform();
  if (platform === 'capacitor') {
    ({ capacitorAdapter: adapter } = await import('./adapters/capacitor.js'));
  } else if (platform === 'electron') {
    ({ electronAdapter: adapter } = await import('./adapters/electron.js'));
  } else {
    ({ webAdapter: adapter } = await import('./adapters/web.js'));
  }
  return adapter;
}

export const NotificationManager = {
  async init() {
    const a = await loadAdapter();
    const settings = getNotificationSettings();
    await a.applySchedule(settings);
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          a.applySchedule(getNotificationSettings()).catch(() => {});
        }
      });
    }
  },

  getSettings() {
    return getNotificationSettings();
  },

  async setSettings(partial) {
    const merged = setNotificationSettings(partial);
    const a = await loadAdapter();
    await a.applySchedule(merged);
    return merged;
  },

  async requestPermission() {
    const a = await loadAdapter();
    return a.requestPermission();
  },

  async cancelAll() {
    const a = await loadAdapter();
    return a.cancelAll();
  },

  platform: detectPlatform()
};
