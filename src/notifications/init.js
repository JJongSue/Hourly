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
  updateTestDesc();
}

function updateTestDesc() {
  const desc = $('notif-test-desc');
  if (!desc) return;
  const platform = NotificationManager.platform;
  const bridge = typeof window !== 'undefined' ? window.hourlyBridge : null;
  if (platform === 'electron' && !bridge) {
    desc.textContent = '⚠ bridge 없음 — preload 오류';
  } else if (platform === 'web' && typeof Notification === 'undefined') {
    desc.textContent = '⚠ 이 브라우저는 알림 미지원';
  } else {
    desc.textContent = `플랫폼: ${platform} — 탭하면 즉시 전송`;
  }
}

function bindUI() {
  const toggle = $('notif-enabled');
  const message = $('notif-message');
  const quietStart = $('notif-quiet-start');
  const quietEnd = $('notif-quiet-end');
  const debug = $('notif-debug-interval');
  const testRow = $('notif-test-row');

  if (toggle) {
    toggle.addEventListener('click', async (e) => {
      e.preventDefault();
      const wantEnabled = !toggle.classList.contains('on');
      if (wantEnabled) {
        const perm = await NotificationManager.requestPermission();
        if (perm !== 'granted') {
          toast(`알림 권한 거부됨 (platform: ${NotificationManager.platform}, bridge: ${!!window.hourlyBridge})`);
          return;
        }
      }
      toggle.classList.toggle('on', wantEnabled);
      await NotificationManager.setSettings({ enabled: wantEnabled });
      toast(wantEnabled ? 'Hourly alarm on' : 'Hourly alarm off');
    });
  }

  if (testRow) {
    testRow.addEventListener('click', async () => {
      const s = NotificationManager.getSettings();
      const platform = NotificationManager.platform;
      try {
        if (platform === 'electron' && window.hourlyBridge) {
          const ok = await window.hourlyBridge.notify({ title: 'Hourly 테스트', body: s.message || 'Hourly check-in' });
          toast(ok ? '알림 전송 성공 ✓' : '알림 전송 실패 (main process 오류)');
        } else if (platform === 'web' || !window.hourlyBridge) {
          const perm = await Notification.requestPermission();
          if (perm === 'granted') {
            new Notification('Hourly 테스트', { body: s.message || 'Hourly check-in' });
            toast('Web 알림 전송 ✓');
          } else {
            toast(`Web 알림 권한: ${perm}`);
          }
        }
      } catch (err) {
        toast(`오류: ${err.message}`);
        console.error('Test notification error:', err);
      }
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
