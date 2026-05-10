import { nextFireTime } from '../schedule.js';

let timer = null;
let active = false;

export const webAdapter = {
  async requestPermission() {
    if (!('Notification' in window)) return 'denied';
    if (Notification.permission === 'granted') return 'granted';
    if (Notification.permission === 'denied') return 'denied';
    return await Notification.requestPermission();
  },

  async cancelAll() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    active = false;
  },

  async applySchedule(settings) {
    await this.cancelAll();
    if (!settings.enabled) return;
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    active = true;
    const tick = () => {
      if (!active) return;
      const now = new Date();
      const next = nextFireTime(now, settings);
      const delay = Math.max(1000, next.getTime() - now.getTime());
      timer = setTimeout(() => {
        if (!active) return;
        try {
          new Notification('Hourly', { body: settings.message || 'Hourly check-in' });
        } catch {}
        tick();
      }, delay);
    };
    tick();
  }
};
