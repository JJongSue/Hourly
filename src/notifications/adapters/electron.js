import { nextFireTime } from '../schedule.js';

let timer = null;
let active = false;

function bridge() {
  return typeof window !== 'undefined' ? window.hourlyBridge : null;
}

export const electronAdapter = {
  async requestPermission() {
    return bridge() ? 'granted' : 'denied';
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
    if (!settings.enabled || !bridge()) return;

    active = true;
    const tick = () => {
      if (!active) return;
      const now = new Date();
      const next = nextFireTime(now, settings);
      const delay = Math.max(1000, next.getTime() - now.getTime());
      timer = setTimeout(() => {
        if (!active) return;
        bridge().notify({ title: 'Hourly', body: settings.message || 'Hourly check-in' });
        tick();
      }, delay);
    };
    tick();
  }
};
