const test = require("node:test");
const assert = require("node:assert/strict");

test("solar mode identifies daytime and nighttime near the equator", async () => {
  const { isSunUp, solarWindow } = await import("../src/solar.mjs");
  const position = { latitude: 0, longitude: 0 };
  const noon = new Date(2026, 2, 20, 12, 0, 0, 0);
  const midnight = new Date(2026, 2, 20, 0, 0, 0, 0);
  const { sunrise, sunset } = solarWindow(noon, position.latitude, position.longitude);
  assert.ok(sunrise.getUTCHours() >= 5 && sunrise.getUTCHours() <= 7);
  assert.ok(sunset.getUTCHours() >= 17 && sunset.getUTCHours() <= 19);
  assert.equal(isSunUp(noon, position), true);
  assert.equal(isSunUp(midnight, position), false);
});
