const fs = require("fs");
const path = require("path");

const STORE_VERSION = 2;
const BOOLEAN_SETTINGS = [
  "launchAtLogin", "showStartupCard", "startInTray", "notificationsEnabled", "notificationSound",
  "imageTransition", "focusMode", "reducedMotion", "autoScrollEnabled", "hoverPausesScroll",
  "rememberReadingPosition", "showReflectionPrompt", "showPrayer", "showAttribution",
  "automaticDailyContent", "automaticDailyImage", "preventFutureDevotionals", "showStreak",
];
const THEMES = ["gold", "blue", "forest", "burgundy", "lavender", "terracotta", "sage", "rose", "teal", "charcoal"];
const TRANSLATIONS = ["KJV", "ASV", "DBT", "DRB", "ERV", "JPS", "WBT", "YLT", "GENEVA_BIBLE1560"];
const validClock = (value) => typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
const validDevotionalId = (value) => typeof value === "string" && /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(value);
const validHistoryDate = (value) => typeof value === "string" && /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(value);
const validReleaseTag = (value) => typeof value === "string" && value.length <= 80 && /^v?\d+\.\d+\.\d+(?:-?[0-9A-Za-z]+(?:[.-][0-9A-Za-z]+)*)?$/.test(value);
const DEFAULT_SETTINGS = Object.freeze({
  launchAtLogin: true,
  closeToTray: true,
  showStartupCard: true,
  startInTray: false,
  notificationsEnabled: true,
  notificationSound: false,
  remindLaterMinutes: 60,
  reminderMode: "times",
  reminderTimes: ["09:00", "12:00", "15:00", "17:00"],
  intervalMinutes: 60,
  activeDays: [1, 2, 3, 4, 5],
  quietHours: { enabled: true, start: "18:00", end: "08:00" },
  theme: "gold",
  colorMode: "system",
  imageOverlay: 38,
  imageTransition: true,
  focusMode: false,
  fontScale: 1,
  scriptureFontScale: 1,
  reducedMotion: false,
  autoScrollEnabled: true,
  autoScrollSpeed: 2,
  hoverPausesScroll: true,
  rememberReadingPosition: true,
  showReflectionPrompt: true,
  showPrayer: true,
  showAttribution: true,
  automaticDailyContent: true,
  automaticDailyImage: true,
  preventFutureDevotionals: false,
  showStreak: true,
  translation: "KJV",
  updateCheckFrequency: "weekly",
});

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeSettings(input = {}) {
  const next = { ...clone(DEFAULT_SETTINGS), ...input };
  for (const key of BOOLEAN_SETTINGS) next[key] = typeof input[key] === "boolean" ? input[key] : DEFAULT_SETTINGS[key];
  next.theme = THEMES.includes(next.theme) ? next.theme : DEFAULT_SETTINGS.theme;
  next.colorMode = ["system", "auto", "light", "dark"].includes(next.colorMode) ? next.colorMode : DEFAULT_SETTINGS.colorMode;
  next.translation = TRANSLATIONS.includes(next.translation) ? next.translation : DEFAULT_SETTINGS.translation;
  next.updateCheckFrequency = ["daily", "weekly", "monthly", "never"].includes(next.updateCheckFrequency)
    ? next.updateCheckFrequency
    : DEFAULT_SETTINGS.updateCheckFrequency;
  next.reminderMode = ["times", "interval"].includes(next.reminderMode) ? next.reminderMode : "times";
  next.reminderTimes = Array.isArray(next.reminderTimes)
    ? [...new Set(next.reminderTimes.filter(validClock))].sort()
    : clone(DEFAULT_SETTINGS.reminderTimes);
  next.intervalMinutes = Math.min(120, Math.max(1, Math.round(Number(next.intervalMinutes) || 60)));
  next.activeDays = Array.isArray(next.activeDays)
    ? [...new Set(next.activeDays.map(Number).filter((day) => day >= 0 && day <= 6))].sort()
    : clone(DEFAULT_SETTINGS.activeDays);
  next.quietHours = {
    ...clone(DEFAULT_SETTINGS.quietHours),
    ...(input.quietHours || {}),
  };
  next.quietHours.enabled = typeof input.quietHours?.enabled === "boolean" ? input.quietHours.enabled : DEFAULT_SETTINGS.quietHours.enabled;
  next.quietHours.start = validClock(next.quietHours.start) ? next.quietHours.start : DEFAULT_SETTINGS.quietHours.start;
  next.quietHours.end = validClock(next.quietHours.end) ? next.quietHours.end : DEFAULT_SETTINGS.quietHours.end;
  next.fontScale = Math.min(1.4, Math.max(0.8, Number(next.fontScale) || 1));
  next.scriptureFontScale = Math.min(1.4, Math.max(0.8, Number(next.scriptureFontScale) || 1));
  next.imageOverlay = Math.min(75, Math.max(10, Number(next.imageOverlay) || 38));
  next.remindLaterMinutes = Math.min(90, Math.max(10, Math.round((Number(next.remindLaterMinutes) || 60) / 10) * 10));
  next.autoScrollSpeed = Math.min(4, Math.max(1, Number(next.autoScrollSpeed) || 2));
  return next;
}

function normalizeState(input = {}) {
  const updateLastCheckedAt = Number(input.updateLastCheckedAt);
  const completions = {};
  if (input.completions && typeof input.completions === "object" && !Array.isArray(input.completions)) {
    for (const [date, timestamp] of Object.entries(input.completions)) {
      const numericTimestamp = Number(timestamp);
      if (validHistoryDate(date) && Number.isFinite(numericTimestamp) && numericTimestamp > 0) completions[date] = numericTimestamp;
    }
  }
  const readingPositions = {};
  if (input.readingPositions && typeof input.readingPositions === "object" && !Array.isArray(input.readingPositions)) {
    for (const [date, position] of Object.entries(input.readingPositions)) {
      const numericPosition = Number(position);
      if (validHistoryDate(date) && Number.isFinite(numericPosition) && numericPosition >= 0) readingPositions[date] = Math.min(numericPosition, 10_000_000);
    }
  }
  return {
    version: STORE_VERSION,
    settings: normalizeSettings(input.settings),
    favourites: Array.isArray(input.favourites) ? [...new Set(input.favourites.filter(validDevotionalId))].slice(0, 366) : [],
    completions,
    readingPositions,
    snoozeUntil: Number(input.snoozeUntil) || 0,
    remindAt: Number(input.remindAt) || 0,
    lastNotificationKey: typeof input.lastNotificationKey === "string" ? input.lastNotificationKey : "",
    updateLastCheckedAt: Number.isFinite(updateLastCheckedAt) && updateLastCheckedAt > 0 && updateLastCheckedAt <= Date.now() + 5 * 60 * 1000
      ? updateLastCheckedAt
      : 0,
    updateLatestTag: validReleaseTag(input.updateLatestTag) ? input.updateLatestTag : "",
    updateNotifiedTag: validReleaseTag(input.updateNotifiedTag) ? input.updateNotifiedTag : "",
    migrationComplete: Boolean(input.migrationComplete),
  };
}

class AppStore {
  constructor(userDataPath) {
    this.filePath = path.join(userDataPath, "work-day-with-god.json");
    this.backupPath = `${this.filePath}.backup`;
    this.state = normalizeState();
    this.load();
  }

  load() {
    try {
      this.state = normalizeState(JSON.parse(fs.readFileSync(this.filePath, "utf8")));
    } catch (error) {
      if (error.code !== "ENOENT") {
        try {
          fs.copyFileSync(this.filePath, `${this.filePath}.corrupt-${Date.now()}`);
        } catch {}
      }
      this.state = normalizeState();
      this.save();
    }
    return this.get();
  }

  save() {
    const directory = path.dirname(this.filePath);
    fs.mkdirSync(directory, { recursive: true });
    const temporaryPath = `${this.filePath}.${process.pid}.tmp`;
    const serialized = JSON.stringify(this.state, null, 2);
    fs.writeFileSync(temporaryPath, serialized, "utf8");
    if (fs.existsSync(this.filePath)) {
      try { fs.copyFileSync(this.filePath, this.backupPath); } catch {}
    }
    fs.renameSync(temporaryPath, this.filePath);
  }

  get() {
    return clone(this.state);
  }

  patchSettings(patch) {
    this.state.settings = normalizeSettings({ ...this.state.settings, ...patch });
    this.save();
    return this.get();
  }

  patchState(patch) {
    this.state = normalizeState({ ...this.state, ...patch, settings: this.state.settings });
    this.save();
    return this.get();
  }

  importLegacy(legacy) {
    if (this.state.migrationComplete) return this.get();
    const settings = {};
    if (legacy?.theme) settings.theme = legacy.theme;
    if (legacy?.fontScale) settings.fontScale = legacy.fontScale;
    if (legacy?.translation) settings.translation = legacy.translation;
    this.state.settings = normalizeSettings({ ...this.state.settings, ...settings });
    if (Array.isArray(legacy?.favourites)) this.state.favourites = [...new Set(legacy.favourites.filter(validDevotionalId))].slice(0, 366);
    this.state.migrationComplete = true;
    this.save();
    return this.get();
  }

  replace(input) {
    this.state = normalizeState(input);
    this.save();
    return this.get();
  }

  reset() {
    this.state = normalizeState();
    this.save();
    return this.get();
  }
}

module.exports = { AppStore, DEFAULT_SETTINGS, normalizeSettings };
