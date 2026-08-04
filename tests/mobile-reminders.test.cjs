const assert = require("node:assert/strict");
const test = require("node:test");

const reminders = import("../src/mobile-reminders.mjs");

test("overnight quiet hours include evening and early morning", async () => {
  const { isInsideQuietHours } = await reminders;
  const quietHours = { enabled: true, start: "18:00", end: "08:00" };
  assert.equal(isInsideQuietHours(new Date(2026, 7, 3, 21, 0), quietHours), true);
  assert.equal(isInsideQuietHours(new Date(2026, 7, 4, 7, 59), quietHours), true);
  assert.equal(isInsideQuietHours(new Date(2026, 7, 4, 8, 0), quietHours), false);
});

test("specific Android reminders honor active days and quiet hours", async () => {
  const { nextSpecificDates } = await reminders;
  const settings = {
    activeDays: [1],
    reminderTimes: ["07:00", "09:00"],
    quietHours: { enabled: true, start: "18:00", end: "08:00" },
  };
  const dates = nextSpecificDates(settings, new Date(2026, 7, 2, 12, 0), 3);
  assert.equal(dates.length, 3);
  assert.ok(dates.every((date) => date.getDay() === 1 && date.getHours() === 9));
});

test("interval Android reminders stay within active days and outside quiet hours", async () => {
  const { nextIntervalDates } = await reminders;
  const settings = {
    activeDays: [1, 2, 3, 4, 5],
    intervalMinutes: 30,
    quietHours: { enabled: true, start: "18:00", end: "08:00" },
  };
  const dates = nextIntervalDates(settings, new Date(2026, 7, 3, 17, 45), 8);
  assert.equal(dates.length, 8);
  assert.ok(dates.every((date) => settings.activeDays.includes(date.getDay())));
  assert.ok(dates.every((date) => date.getHours() >= 8 && date.getHours() < 18));
  assert.equal(dates[0].getHours(), 8);
  assert.equal(dates[0].getDate(), 4);
});

test("Android reminder batches stay bounded for responsive state changes", async () => {
  const { nextIntervalDates, nextSpecificDates } = await reminders;
  const base = {
    activeDays: [0, 1, 2, 3, 4, 5, 6],
    reminderTimes: ["08:00", "09:00", "10:00", "11:00"],
    intervalMinutes: 1,
    quietHours: { enabled: false, start: "18:00", end: "08:00" },
  };
  assert.equal(nextSpecificDates(base, new Date(2026, 7, 3, 7, 0)).length, 128);
  assert.equal(nextIntervalDates(base, new Date(2026, 7, 3, 7, 0)).length, 128);
});

test("Android devotional notification types have distinct content and channels", async () => {
  const { reminderNotificationChannels, reminderNotificationDefinition } = await reminders;
  const daily = reminderNotificationDefinition("daily-reading", true);
  const later = reminderNotificationDefinition("remind-later", true);
  const timer = reminderNotificationDefinition("devotional-timer", true);
  assert.equal(new Set([daily.title, later.title, timer.title]).size, 3);
  assert.equal(new Set([daily.body, later.body, timer.body]).size, 3);
  assert.equal(new Set([daily.channelId, later.channelId, timer.channelId]).size, 3);
  assert.equal(daily.view, "today");
  assert.equal(later.view, "card");
  assert.equal(timer.view, "card");
  assert.equal(reminderNotificationDefinition("daily-reading", false).channelId, "wdwg-daily-reading-silent");
  assert.equal(reminderNotificationChannels().length, 6);
});
