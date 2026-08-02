const test = require("node:test");
const assert = require("node:assert/strict");

let calendar;
test.before(async () => {
  calendar = await import("../src/calendar.mjs");
});

test("history starts on a month containing a past date", () => {
  const firstOfMarch = new Date(2026, 2, 1, 12);
  const month = calendar.calendarStartMonth("history", firstOfMarch);
  assert.equal(month.getFullYear(), 2026);
  assert.equal(month.getMonth(), 1);
  assert.equal(month.getDate(), 1);
});

test("future devotionals include today while history contains only past dates", () => {
  const today = new Date(2026, 7, 2, 12);
  const yesterday = new Date(2026, 7, 1, 12);
  const tomorrow = new Date(2026, 7, 3, 12);

  assert.equal(calendar.isCalendarDateAvailable("history", yesterday, today), true);
  assert.equal(calendar.isCalendarDateAvailable("history", today, today), false);
  assert.equal(calendar.isCalendarDateAvailable("future", yesterday, today), false);
  assert.equal(calendar.isCalendarDateAvailable("future", today, today), true);
  assert.equal(calendar.isCalendarDateAvailable("future", tomorrow, today), true);
});

test("adjacent reading navigation respects the same today boundary", () => {
  const today = new Date(2026, 7, 2, 12);
  const yesterday = new Date(2026, 7, 1, 12);

  assert.equal(calendar.isAdjacentReadingAvailable("past", yesterday, today), true);
  assert.equal(calendar.isAdjacentReadingAvailable("past", today, today), false);
  assert.equal(calendar.isAdjacentReadingAvailable("future", yesterday, today), false);
  assert.equal(calendar.isAdjacentReadingAvailable("future", today, today), true);
  assert.equal(calendar.isAdjacentReadingAvailable("today", today, today), false);
});
