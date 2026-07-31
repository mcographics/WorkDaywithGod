const { powerMonitor } = require("electron");

function minutesFromClock(value) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function inQuietHours(nowMinutes, quietHours) {
  if (!quietHours?.enabled) return false;
  const start = minutesFromClock(quietHours.start);
  const end = minutesFromClock(quietHours.end);
  if (start === end) return true;
  return start < end
    ? nowMinutes >= start && nowMinutes < end
    : nowMinutes >= start || nowMinutes < end;
}

class ReminderScheduler {
  constructor({ store, notify }) {
    this.store = store;
    this.notify = notify;
    this.timer = null;
    this.lastTickAt = 0;
    this.boundResume = () => this.tick(true);
  }

  start() {
    this.stop();
    this.tick(true);
    this.timer = setInterval(() => this.tick(false), 30_000);
    powerMonitor.on("resume", this.boundResume);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    if (powerMonitor) powerMonitor.removeListener("resume", this.boundResume);
  }

  status() {
    const state = this.store.get();
    return {
      paused: state.snoozeUntil > Date.now(),
      snoozeUntil: state.snoozeUntil,
      nextReminder: this.nextReminder(new Date(), state),
    };
  }

  nextReminder(from, state = this.store.get()) {
    const settings = state.settings;
    for (let offset = 0; offset < 8; offset += 1) {
      const day = new Date(from);
      day.setDate(from.getDate() + offset);
      if (!settings.activeDays.includes(day.getDay())) continue;
      const candidates = settings.reminderMode === "times"
        ? settings.reminderTimes.map(minutesFromClock)
        : Array.from({ length: Math.floor(24 * 60 / settings.intervalMinutes) }, (_, index) => index * settings.intervalMinutes);
      for (const minute of candidates) {
        const candidate = new Date(day);
        candidate.setHours(Math.floor(minute / 60), minute % 60, 0, 0);
        if (candidate <= from || inQuietHours(minute, settings.quietHours)) continue;
        if (candidate.getTime() <= state.snoozeUntil) continue;
        return candidate.getTime();
      }
    }
    return null;
  }

  tick(forceReschedule) {
    const now = new Date();
    const state = this.store.get();
    const settings = state.settings;
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    this.lastTickAt = now.getTime();
    if (!settings.activeDays.includes(now.getDay())) return;
    if (state.snoozeUntil > now.getTime() || inQuietHours(nowMinutes, settings.quietHours)) return;

    let due = false;
    let slot = "";
    if (settings.reminderMode === "times") {
      slot = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      due = settings.reminderTimes.includes(slot);
    } else {
      const interval = settings.intervalMinutes;
      due = nowMinutes % interval === 0;
      slot = `interval-${Math.floor(nowMinutes / interval)}`;
    }

    const key = `${dateKey(now)}:${slot}`;
    if (due && key !== state.lastNotificationKey) {
      this.store.patchState({ lastNotificationKey: key });
      this.notify(now);
    } else if (forceReschedule) {
      // Resume/restart intentionally never replays a missed reminder.
    }
  }
}

module.exports = { ReminderScheduler, dateKey, inQuietHours, minutesFromClock };
