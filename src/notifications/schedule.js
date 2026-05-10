function parseHHMM(s) {
  const [h, m] = String(s).split(':').map(n => parseInt(n, 10));
  return { h: h || 0, m: m || 0 };
}

function inQuietHours(date, quietStart, quietEnd) {
  if (!quietStart || !quietEnd || quietStart === quietEnd) return false;
  const { h: sh, m: sm } = parseHHMM(quietStart);
  const { h: eh, m: em } = parseHHMM(quietEnd);
  const cur = date.getHours() * 60 + date.getMinutes();
  const start = sh * 60 + sm;
  const end = eh * 60 + em;
  if (start < end) return cur >= start && cur < end;
  return cur >= start || cur < end;
}

export function nextFireTime(now, settings) {
  const intervalMin = settings.debugIntervalMin > 0 ? settings.debugIntervalMin : 60;
  const next = new Date(now);

  if (intervalMin >= 60) {
    next.setHours(next.getHours() + 1, 0, 0, 0);
  } else {
    const minutes = next.getMinutes();
    const slot = Math.floor(minutes / intervalMin) + 1;
    next.setMinutes(slot * intervalMin, 0, 0);
  }

  let guard = 0;
  while (inQuietHours(next, settings.quietStart, settings.quietEnd) && guard < 48) {
    if (intervalMin >= 60) {
      next.setHours(next.getHours() + 1);
    } else {
      next.setMinutes(next.getMinutes() + intervalMin);
    }
    guard++;
  }
  return next;
}

export function buildBatch(now, settings, count = 24) {
  const out = [];
  let cursor = new Date(now);
  for (let i = 0; i < count; i++) {
    const t = nextFireTime(cursor, settings);
    out.push(t);
    cursor = new Date(t.getTime() + 1000);
  }
  return out;
}

export function notificationIdFor(date) {
  const hourEpoch = Math.floor(date.getTime() / (60 * 60 * 1000));
  return 1000 + (hourEpoch % 100000);
}
