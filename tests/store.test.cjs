const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { AppStore } = require("../electron/store.cjs");

test("store creates defaults and persists validated settings", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "wdwg-store-"));
  const store = new AppStore(directory);
  assert.equal(store.get().settings.launchAtLogin, true);
  store.patchSettings({ intervalMinutes: 2, reminderTimes: ["09:00", "bad"] });
  const reloaded = new AppStore(directory).get();
  assert.equal(reloaded.settings.intervalMinutes, 15);
  assert.deepEqual(reloaded.settings.reminderTimes, ["09:00"]);
  fs.rmSync(directory, { recursive: true, force: true });
});

test("malformed state recovers to defaults", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "wdwg-store-"));
  fs.writeFileSync(path.join(directory, "work-day-with-god.json"), "{broken", "utf8");
  const store = new AppStore(directory);
  assert.equal(store.get().version, 1);
  assert.equal(store.get().settings.theme, "gold");
  fs.rmSync(directory, { recursive: true, force: true });
});

test("expanded settings and reading state persist", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "wdwg-store-"));
  const store = new AppStore(directory);
  store.patchSettings({
    notificationsEnabled: false,
    colorMode: "dark",
    theme: "teal",
    scriptureFontScale: 1.25,
    imageOverlay: 55,
    remindLaterMinutes: 20,
  });
  store.patchState({ readingPositions: { "2026-07-30": 420 } });
  const state = new AppStore(directory).get();
  assert.equal(state.settings.notificationsEnabled, false);
  assert.equal(state.settings.colorMode, "dark");
  assert.equal(state.settings.theme, "teal");
  assert.equal(state.settings.scriptureFontScale, 1.25);
  assert.equal(state.settings.imageOverlay, 55);
  assert.equal(state.settings.remindLaterMinutes, 20);
  assert.equal(state.readingPositions["2026-07-30"], 420);
  fs.rmSync(directory, { recursive: true, force: true });
});
