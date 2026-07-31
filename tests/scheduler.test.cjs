const test = require("node:test");
const assert = require("node:assert/strict");
const { inQuietHours, minutesFromClock, dateKey } = require("../electron/scheduler.cjs");

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
