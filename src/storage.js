const PREF_KEY = 'hourly_prefs_v5';

const DEFAULT_NOTIFICATIONS = {
  enabled: false,
  message: 'Hourly check-in',
  quietStart: '23:00',
  quietEnd: '07:00',
  debugIntervalMin: 0
};

export function loadPrefs() {
  try {
    return JSON.parse(localStorage.getItem(PREF_KEY)) || {};
  } catch {
    return {};
  }
}

export function persistPrefs(p) {
  try {
    localStorage.setItem(PREF_KEY, JSON.stringify(p));
  } catch {}
}

export function getNotificationSettings() {
  const p = loadPrefs();
  return { ...DEFAULT_NOTIFICATIONS, ...(p.notifications || {}) };
}

export function setNotificationSettings(partial) {
  const p = loadPrefs();
  p.notifications = { ...DEFAULT_NOTIFICATIONS, ...(p.notifications || {}), ...partial };
  persistPrefs(p);
  return p.notifications;
}
