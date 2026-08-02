const test = require("node:test");
const assert = require("node:assert/strict");
const { ReminderScheduler, inQuietHours, minutesFromClock, dateKey } = require("../electron/scheduler.cjs");

test("clock strings convert to minutes", () => {
  assert.equal(minutesFromClock("09:30"), 570);
  assert.equal(minutesFromClock("00:00"), 0);
});

test("overnight quiet hours span midnight", () => {
  const quiet = { enabled: true, start: "18:00", end: "08:00" };
  assert.equal(inQuietHours(19 * 60, quiet), true);
  assert.equal(inQuietHours(7 * 60, quiet), true);
  assert.equal(inQuietHours(12 * 60, quiet), false);
});

test("same-day quiet hours", () => {
  const quiet = { enabled: true, start: "12:00", end: "14:00" };
  assert.equal(inQuietHours(13 * 60, quiet), true);
  assert.equal(inQuietHours(15 * 60, quiet), false);
});

test("notification date keys use local calendar dates", () => {
  assert.equal(dateKey(new Date(2026, 6, 30, 12)), "2026-07-30");
});

test("next reminder respects fixed times, quiet hours, and snooze state", () => {
  const state = {
    snoozeUntil: 0,
    settings: {
      activeDays: [1], reminderMode: "times", reminderTimes: ["09:00", "12:00"], intervalMinutes: 60,
      quietHours: { enabled: true, start: "08:30", end: "10:00" },
    },
  };
  const scheduler = new ReminderScheduler({ store: { get: () => state }, notify() {} });
  const monday = new Date(2026, 7, 3, 8, 0, 0, 0);
  assert.equal(scheduler.nextReminder(monday, state), new Date(2026, 7, 3, 12, 0, 0, 0).getTime());
  state.snoozeUntil = new Date(2026, 7, 3, 12, 30, 0, 0).getTime();
  assert.equal(scheduler.nextReminder(monday, state), new Date(2026, 7, 10, 12, 0, 0, 0).getTime());
});

test("next interval reminder skips quiet hours", () => {
  const state = {
    snoozeUntil: 0,
    settings: {
      activeDays: [1, 2, 3, 4, 5], reminderMode: "interval", reminderTimes: [], intervalMinutes: 90,
      quietHours: { enabled: true, start: "18:00", end: "08:00" },
    },
  };
  const scheduler = new ReminderScheduler({ store: { get: () => state }, notify() {} });
  const monday = new Date(2026, 7, 3, 7, 15, 0, 0);
  assert.equal(scheduler.nextReminder(monday, state), new Date(2026, 7, 3, 9, 0, 0, 0).getTime());
});

test("clearing every active day disables and clears a pending timer", () => {
  let notified = false;
  const state = {
    remindAt: Date.now() - 1000,
    snoozeUntil: Date.now() + 60_000,
    settings: {
      notificationsEnabled: true,
      activeDays: [], reminderMode: "times", reminderTimes: ["09:00"], intervalMinutes: 60,
      quietHours: { enabled: false, start: "18:00", end: "08:00" },
    },
  };
  const store = {
    get: () => state,
    patchState: (patch) => Object.assign(state, patch),
  };
  const scheduler = new ReminderScheduler({ store, notify: () => { notified = true; } });
  scheduler.tick(false);
  assert.equal(notified, false);
  assert.equal(state.remindAt, 0);
  assert.equal(state.snoozeUntil, 0);
  assert.equal(scheduler.nextReminder(new Date(), state), null);
});
