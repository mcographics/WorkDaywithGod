const minutesFromClock = (clock) => {
  const [hour, minute] = clock.split(":").map(Number);
  return hour * 60 + minute;
};

const notificationKinds = {
  "daily-reading": {
    title: "Today’s devotional is ready",
    body: "Take a quiet moment with today’s Scripture and Christ-centred encouragement.",
    view: "today",
    channelName: "Daily reading reminders",
    channelDescription: "Reminders for devotional reading times selected in Work Day with God",
  },
  "remind-later": {
    title: "Your quiet moment is ready",
    body: "Your Remind me later request is ready. Return to today’s Verse Card.",
    view: "card",
    channelName: "Remind me later",
    channelDescription: "One-time reminders requested from the Work Day with God Verse Card",
  },
  "devotional-timer": {
    title: "Devotional timer",
    body: "Your devotional timer has finished. Return to today’s Verse Card for Scripture and encouragement.",
    view: "card",
    channelName: "Devotional timer",
    channelDescription: "Repeating devotional timer reminders selected in Work Day with God",
  },
};

export function reminderNotificationDefinition(kind, sound = false) {
  if (kind === "test") {
    return {
      title: "Work Day with God",
      body: "Your gentle Android reminders are working.",
      channelId: sound ? "wdwg-daily-reading" : "wdwg-daily-reading-silent",
      view: "today",
    };
  }
  const definition = notificationKinds[kind] || notificationKinds["daily-reading"];
  const channelBase = `wdwg-${notificationKinds[kind] ? kind : "daily-reading"}`;
  return {
    title: definition.title,
    body: definition.body,
    channelId: sound ? channelBase : `${channelBase}-silent`,
    view: definition.view,
  };
}

export function reminderNotificationChannels() {
  return Object.entries(notificationKinds).flatMap(([kind, definition]) => ([
    {
      id: `wdwg-${kind}`,
      name: definition.channelName,
      description: definition.channelDescription,
      importance: 3,
      vibration: false,
      visibility: 0,
    },
    {
      id: `wdwg-${kind}-silent`,
      name: `${definition.channelName} (silent)`,
      description: `${definition.channelDescription}, without sound or vibration`,
      importance: 2,
      vibration: false,
      visibility: 0,
    },
  ]));
}

export function isInsideQuietHours(date, quietHours) {
  if (!quietHours?.enabled) return false;
  const value = date.getHours() * 60 + date.getMinutes();
  const start = minutesFromClock(quietHours.start);
  const end = minutesFromClock(quietHours.end);
  if (start === end) return true;
  return start < end ? value >= start && value < end : value >= start || value < end;
}

export function nextIntervalDates(settings, now = new Date(), limit = 128) {
  const results = [];
  const intervalMs = settings.intervalMinutes * 60_000;
  let candidate = new Date(Math.ceil((now.getTime() + 5_000) / intervalMs) * intervalMs);
  const searchLimitMinutes = 32 * 24 * 60;
  for (let inspected = 0; inspected < searchLimitMinutes && results.length < limit; inspected += settings.intervalMinutes) {
    if (settings.activeDays.includes(candidate.getDay()) && !isInsideQuietHours(candidate, settings.quietHours)) {
      results.push(new Date(candidate));
    }
    candidate = new Date(candidate.getTime() + intervalMs);
  }
  return results;
}

export function nextSpecificDates(settings, now = new Date(), limit = 128) {
  const results = [];
  const start = new Date(now);
  start.setSeconds(0, 0);
  for (let offset = 0; offset < 366 && results.length < limit; offset += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + offset);
    if (!settings.activeDays.includes(date.getDay())) continue;
    for (const clock of settings.reminderTimes) {
      const [hour, minute] = clock.split(":").map(Number);
      const candidate = new Date(date);
      candidate.setHours(hour, minute, 0, 0);
      if (candidate <= now || isInsideQuietHours(candidate, settings.quietHours)) continue;
      results.push(candidate);
      if (results.length >= limit) break;
    }
  }
  return results.sort((left, right) => left - right);
}
