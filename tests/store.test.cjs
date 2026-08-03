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
  assert.equal(store.get().settings.updateCheckFrequency, "weekly");
  store.patchSettings({ intervalMinutes: 2, reminderTimes: ["09:00", "bad"], updateCheckFrequency: "daily" });
  const reloaded = new AppStore(directory).get();
  assert.equal(reloaded.settings.intervalMinutes, 2);
  assert.deepEqual(reloaded.settings.reminderTimes, ["09:00"]);
  assert.equal(reloaded.settings.updateCheckFrequency, "daily");
  fs.rmSync(directory, { recursive: true, force: true });
});

test("malformed state recovers to defaults", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "wdwg-store-"));
  fs.writeFileSync(path.join(directory, "work-day-with-god.json"), "{broken", "utf8");
  const store = new AppStore(directory);
  assert.equal(store.get().version, 2);
  assert.equal(store.get().settings.theme, "gold");
  fs.rmSync(directory, { recursive: true, force: true });
});

test("expanded settings and reading state persist", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "wdwg-store-"));
  const store = new AppStore(directory);
  store.patchSettings({
    notificationsEnabled: false,
    colorMode: "auto",
    theme: "teal",
    scriptureFontScale: 1.25,
    imageOverlay: 55,
    remindLaterMinutes: 24,
  });
  store.patchState({ readingPositions: { "2026-07-30": 420 } });
  const state = new AppStore(directory).get();
  assert.equal(state.settings.notificationsEnabled, false);
  assert.equal(state.settings.colorMode, "auto");
  assert.equal(state.settings.theme, "teal");
  assert.equal(state.settings.scriptureFontScale, 1.25);
  assert.equal(state.settings.imageOverlay, 55);
  assert.equal(state.settings.remindLaterMinutes, 20);
  assert.equal(state.readingPositions["2026-07-30"], 420);
  fs.rmSync(directory, { recursive: true, force: true });
});

test("reminder minute ranges and ten-minute remind-later increments are normalized", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "wdwg-store-"));
  const store = new AppStore(directory);
  assert.equal(store.patchSettings({ intervalMinutes: -4 }).settings.intervalMinutes, 1);
  assert.equal(store.patchSettings({ intervalMinutes: 121 }).settings.intervalMinutes, 120);
  assert.equal(store.patchSettings({ intervalMinutes: 37.6 }).settings.intervalMinutes, 38);
  assert.equal(store.patchSettings({ remindLaterMinutes: 9 }).settings.remindLaterMinutes, 10);
  assert.equal(store.patchSettings({ remindLaterMinutes: 67 }).settings.remindLaterMinutes, 70);
  assert.equal(store.patchSettings({ remindLaterMinutes: 999 }).settings.remindLaterMinutes, 90);
  fs.rmSync(directory, { recursive: true, force: true });
});

test("update preferences and release metadata are normalized before persistence", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "wdwg-store-"));
  const store = new AppStore(directory);
  assert.equal(store.patchSettings({ updateCheckFrequency: "monthly" }).settings.updateCheckFrequency, "monthly");
  assert.equal(store.patchSettings({ updateCheckFrequency: "hourly" }).settings.updateCheckFrequency, "weekly");
  const checkedAt = Date.now() - 1000;
  const state = store.patchState({
    updateLastCheckedAt: checkedAt,
    updateLatestTag: "v1.4.2",
    updateNotifiedTag: "../../unsafe",
  });
  assert.equal(state.updateLastCheckedAt, checkedAt);
  assert.equal(state.updateLatestTag, "v1.4.2");
  assert.equal(state.updateNotifiedTag, "");
  const imported = store.replace({
    updateLastCheckedAt: Date.now() + 24 * 60 * 60 * 1000,
    updateLatestTag: "https://example.com/release",
    updateNotifiedTag: "v2.0.0",
    settings: { updateCheckFrequency: "never" },
  });
  assert.equal(imported.updateLastCheckedAt, 0);
  assert.equal(imported.updateLatestTag, "");
  assert.equal(imported.updateNotifiedTag, "v2.0.0");
  assert.equal(imported.settings.updateCheckFrequency, "never");
  fs.rmSync(directory, { recursive: true, force: true });
});

test("invalid imported appearance, translation, booleans, and quiet hours recover safely", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "wdwg-store-"));
  const store = new AppStore(directory);
  const state = store.replace({ settings: {
    theme: "injected-theme",
    colorMode: "unknown",
    translation: "MISSING",
    notificationsEnabled: "yes",
    quietHours: { enabled: "yes", start: "99:00", end: "bad" },
  } });
  assert.equal(state.settings.theme, "gold");
  assert.equal(state.settings.colorMode, "system");
  assert.equal(state.settings.translation, "KJV");
  assert.equal(state.settings.notificationsEnabled, true);
  assert.deepEqual(state.settings.quietHours, { enabled: true, start: "18:00", end: "08:00" });
  fs.rmSync(directory, { recursive: true, force: true });
});

test("imported history and favourites discard unsafe keys and values", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "wdwg-store-"));
  const store = new AppStore(directory);
  const state = store.replace({
    favourites: ["07-30", "07-30", "../../escape", { id: "07-31" }],
    completions: {
      "2026-07-30": 123456,
      "../../escape": 987654,
      "2026-07-31": "not-a-timestamp",
    },
    readingPositions: {
      "2026-07-30": 420,
      "2026-07-31": -10,
      "not-a-date": 900,
      "2026-08-01": Number.POSITIVE_INFINITY,
    },
  });
  assert.deepEqual(state.favourites, ["07-30"]);
  assert.deepEqual(state.completions, { "2026-07-30": 123456 });
  assert.deepEqual(state.readingPositions, { "2026-07-30": 420 });
  fs.rmSync(directory, { recursive: true, force: true });
});
