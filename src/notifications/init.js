import { NotificationManager } from './NotificationManager.js';

function $(id) { return document.getElementById(id); }

function toast(msg) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2200);
}

function hydrateUI() {
  const s = NotificationManager.getSettings();
  const toggle = $('notif-enabled');
  const message = $('notif-message');
  const quietStart = $('notif-quiet-start');
  const quietEnd = $('notif-quiet-end');
  const debug = $('notif-debug-interval');
  if (toggle) toggle.classList.toggle('on', !!s.enabled);
  if (message) message.value = s.message || '';
  if (quietStart) quietStart.value = s.quietStart || '';
  if (quietEnd) quietEnd.value = s.quietEnd || '';
  if (debug) debug.value = String(s.debugIntervalMin ?? 0);
}

function bindUI() {
  const toggle = $('notif-enabled');
  const message = $('notif-message');
  const quietStart = $('notif-quiet-start');
  const quietEnd = $('notif-quiet-end');
  const debug = $('notif-debug-interval');

  if (toggle) {
    toggle.addEventListener('click', async (e) => {
      e.preventDefault();
      const wantEnabled = !toggle.classList.contains('on');
      if (wantEnabled) {
        const perm = await NotificationManager.requestPermission();
        if (perm !== 'granted') {
          toast('Notification permission denied');
          return;
        }
      }
      toggle.classList.toggle('on', wantEnabled);
      await NotificationManager.setSettings({ enabled: wantEnabled });
      toast(wantEnabled ? 'Hourly alarm on' : 'Hourly alarm off');
    });
  }

  const persistText = el => el?.addEventListener('change', async () => {
    const patch = {};
    if (el === message) patch.message = el.value.trim() || 'Hourly check-in';
    if (el === quietStart) patch.quietStart = el.value;
    if (el === quietEnd) patch.quietEnd = el.value;
    if (el === debug) patch.debugIntervalMin = parseInt(el.value, 10) || 0;
    await NotificationManager.setSettings(patch);
  });
  [message, quietStart, quietEnd, debug].forEach(persistText);
}

function start() {
  hydrateUI();
  bindUI();
  NotificationManager.init().catch(err => console.warn('NotificationManager init failed', err));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start);
} else {
  start();
}
