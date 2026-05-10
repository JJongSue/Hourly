import { nextFireTime } from '../schedule.js';

let timer = null;
let active = false;
let nextScheduledAt = null;

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
    nextScheduledAt = null;
    window.dispatchEvent(new CustomEvent('hourly:schedule-update', { detail: { next: null } }));
  },

  getNextScheduled() {
    return nextScheduledAt;
  },

  async applySchedule(settings) {
    await this.cancelAll();
    if (!settings.enabled || !bridge()) {
      console.log('[Hourly] applySchedule skipped:', { enabled: settings.enabled, hasBridge: !!bridge() });
      return;
    }

    active = true;
    const tick = () => {
      if (!active) return;
      const now = new Date();
      const next = nextFireTime(now, settings);
      const delay = Math.max(1000, next.getTime() - now.getTime());
      nextScheduledAt = next;
      console.log(`[Hourly] Next alarm at ${next.toLocaleTimeString()} (in ${Math.round(delay / 1000)}s)`);
      window.dispatchEvent(new CustomEvent('hourly:schedule-update', { detail: { next } }));
      timer = setTimeout(() => {
        if (!active) return;
        console.log('[Hourly] Firing notification at', new Date().toLocaleTimeString());
        bridge().notify({ title: 'Hourly', body: settings.message || 'Hourly check-in' });
        window.dispatchEvent(new CustomEvent('hourly:fired'));
        tick();
      }, delay);
    };
    tick();
  }
};

