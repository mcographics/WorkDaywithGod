import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import { Geolocation } from "@capacitor/geolocation";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Preferences } from "@capacitor/preferences";
import { Share } from "@capacitor/share";
import { StatusBar, Style } from "@capacitor/status-bar";
import {
  nextIntervalDates,
  nextSpecificDates,
  mobileNotificationLimit,
  reminderNotificationChannels,
  reminderNotificationDefinition,
} from "./mobile-reminders.mjs";

export const defaultSettings = {
  launchAtLogin: true, closeToTray: true, showStartupCard: true, startInTray: false,
  notificationsEnabled: true, notificationSound: false, remindLaterMinutes: 60, reminderMode: "times",
  reminderTimes: ["09:00", "12:00", "15:00", "17:00"], intervalMinutes: 60,
  activeDays: [1, 2, 3, 4, 5], quietHours: { enabled: true, start: "18:00", end: "08:00" },
  theme: "gold", colorMode: "system", imageOverlay: 38, imageTransition: true,
  focusMode: false, fontScale: 1, cardFontScale: 1, scriptureFontScale: 1, displayScale: "system", screenResolution: "system", reducedMotion: false,
  autoScrollEnabled: true, autoScrollSpeed: 2, hoverPausesScroll: true,
  rememberReadingPosition: true, showReflectionPrompt: true, showPrayer: true, showAttribution: true,
  automaticDailyContent: true, automaticDailyImage: true, preventFutureDevotionals: false, showStreak: true,
  translation: "KJV", updateCheckFrequency: "weekly",
};

const defaultState = () => ({
  settings: { ...defaultSettings, quietHours: { ...defaultSettings.quietHours } },
  favourites: [],
  completions: {},
  readingPositions: {},
  snoozeUntil: 0,
  remindAt: 0,
  migrationComplete: true,
});

const STATE_KEY = "work-day-with-god-state-v1";
const NOTIFICATION_ID_START = 2_000_000;
const NOTIFICATION_ID_END = 2_000_499;
const TEST_NOTIFICATION_IDS = {
  test: 2_000_900,
  "daily-reading": 2_000_901,
  "remind-later": 2_000_902,
  "devotional-timer": 2_000_903,
};
const LEGACY_SILENT_CHANNEL_ID = "wdwg-gentle-silent";
const SUPPORT_URL = "https://discord.gg/2UvdpY4JSW";
const nativePlatformName = Capacitor.isNativePlatform() ? Capacitor.getPlatform() : "";
const isNativeAndroid = nativePlatformName === "android";
const isNativeIos = nativePlatformName === "ios";
const isNativeMobile = isNativeAndroid || isNativeIos;
const mobileSystemName = isNativeIos ? "iOS" : "Android";

export const isMobilePlatform = isNativeMobile;
export const platformName = isNativeMobile ? nativePlatformName : (window.desktop ? "windows" : "browser");

if (typeof document !== "undefined") {
  document.documentElement.dataset.platform = platformName;
  document.documentElement.classList.toggle("platform-mobile", isNativeMobile);
  document.documentElement.classList.toggle("platform-android", isNativeAndroid);
  document.documentElement.classList.toggle("platform-ios", isNativeIos);
}

const clone = (value) => JSON.parse(JSON.stringify(value));
const validClock = (value) => typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
const clampNumber = (value, fallback, min, max) => Math.min(max, Math.max(min, Number.isFinite(Number(value)) ? Number(value) : fallback));
const normalizeRemindLater = (value) => Math.min(90, Math.max(10, Math.round(clampNumber(value, 60, 10, 90) / 10) * 10));

function normalizeSettings(input = {}) {
  const merged = {
    ...defaultSettings,
    ...(input && typeof input === "object" ? input : {}),
    quietHours: {
      ...defaultSettings.quietHours,
      ...(input?.quietHours && typeof input.quietHours === "object" ? input.quietHours : {}),
    },
  };
  merged.reminderMode = ["times", "interval"].includes(merged.reminderMode) ? merged.reminderMode : "times";
  merged.reminderTimes = Array.isArray(merged.reminderTimes)
    ? [...new Set(merged.reminderTimes.filter(validClock))].sort()
    : [...defaultSettings.reminderTimes];
  merged.intervalMinutes = Math.round(clampNumber(merged.intervalMinutes, 60, 1, 120));
  merged.remindLaterMinutes = normalizeRemindLater(merged.remindLaterMinutes);
  merged.cardFontScale = clampNumber(merged.cardFontScale, 1, 0.65, 1.4);
  merged.displayScale = ["system", "0.65", "0.75", "0.85", "1", "1.15", "1.25", "1.5"].includes(String(merged.displayScale))
    ? String(merged.displayScale)
    : defaultSettings.displayScale;
  merged.screenResolution = ["system", "1280x720", "1920x1080", "2560x1440", "3840x2160"].includes(String(merged.screenResolution))
    ? String(merged.screenResolution)
    : defaultSettings.screenResolution;
  merged.activeDays = Array.isArray(merged.activeDays)
    ? [...new Set(merged.activeDays.map(Number).filter((day) => Number.isInteger(day) && day >= 0 && day <= 6))].sort()
    : [...defaultSettings.activeDays];
  merged.quietHours.enabled = Boolean(merged.quietHours.enabled);
  merged.quietHours.start = validClock(merged.quietHours.start) ? merged.quietHours.start : defaultSettings.quietHours.start;
  merged.quietHours.end = validClock(merged.quietHours.end) ? merged.quietHours.end : defaultSettings.quietHours.end;
  return merged;
}

function normalizeState(input) {
  const source = input && typeof input === "object" ? input : {};
  return {
    ...defaultState(),
    ...source,
    settings: normalizeSettings(source.settings),
    favourites: Array.isArray(source.favourites) ? [...new Set(source.favourites.filter((id) => typeof id === "string"))] : [],
    completions: source.completions && typeof source.completions === "object" && !Array.isArray(source.completions) ? { ...source.completions } : {},
    readingPositions: source.readingPositions && typeof source.readingPositions === "object" && !Array.isArray(source.readingPositions) ? { ...source.readingPositions } : {},
    snoozeUntil: Math.max(0, Number(source.snoozeUntil) || 0),
    remindAt: Math.max(0, Number(source.remindAt) || 0),
    migrationComplete: true,
  };
}

let browserState;
try {
  browserState = normalizeState(JSON.parse(localStorage.getItem(STATE_KEY) || "null"));
} catch {
  browserState = defaultState();
}
const browserSnapshot = () => clone(browserState);
const saveBrowserState = () => localStorage.setItem(STATE_KEY, JSON.stringify(browserState));

const emptyListeners = () => () => {};
const browserPosition = () => new Promise((resolve, reject) => {
  if (!navigator.geolocation) {
    reject(new Error("Location is unavailable on this device."));
    return;
  }
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude }),
    reject,
    { enableHighAccuracy: false, maximumAge: 24 * 60 * 60 * 1000, timeout: 5000 },
  );
});
const browserPlatform = {
  platform: "browser",
  isMobile: false,
  minimize() {}, close() {}, setMode() {},
  exitApp() {},
  getPosition: browserPosition,
  getState: async () => browserSnapshot(),
  updateSettings: async (patch) => {
    browserState.settings = normalizeSettings({ ...browserState.settings, ...patch });
    if (!browserState.settings.activeDays.length) browserState = { ...browserState, snoozeUntil: 0, remindAt: 0 };
    saveBrowserState();
    return browserSnapshot();
  },
  updateState: async (patch) => {
    browserState = normalizeState({ ...browserState, ...patch });
    saveBrowserState();
    return browserSnapshot();
  },
  migrateLegacy: async (legacy) => {
    browserState = normalizeState({ ...browserState, settings: { ...browserState.settings, ...legacy }, favourites: legacy?.favourites });
    saveBrowserState();
    return browserSnapshot();
  },
  snooze: async (snoozeUntil) => {
    browserState.snoozeUntil = Math.max(0, Number(snoozeUntil) || 0);
    saveBrowserState();
    return browserSnapshot();
  },
  remindLater: async (remindAt) => {
    if (!browserState.settings.activeDays.length) throw new Error("Select at least one active reminder day first.");
    browserState.remindAt = Math.max(0, Number(remindAt) || 0);
    browserState.snoozeUntil = browserState.remindAt;
    saveBrowserState();
    return browserSnapshot();
  },
  testNotification: async () => ({ supported: false }),
  requestExactNotificationPermission: async () => ({ granted: false }),
  openDataFolder: async () => "",
  exportData: async () => ({ canceled: true }),
  importData: async () => ({ canceled: true }),
  resetHistory: async () => {
    browserState = { ...browserState, completions: {}, readingPositions: {} };
    saveBrowserState();
    return browserSnapshot();
  },
  resetFavourites: async () => {
    browserState = { ...browserState, favourites: [] };
    saveBrowserState();
    return browserSnapshot();
  },
  resetAll: async () => {
    browserState = defaultState();
    saveBrowserState();
    return browserSnapshot();
  },
  getAppInfo: async () => ({ version: "1.4.3", notificationSupported: false, exactNotificationSupported: false, platform: "browser", mobile: false }),
  getUpdateStatus: async () => ({ currentVersion: "1.4.3", latestVersion: "", updateAvailable: false, checking: false, supported: false }),
  checkForUpdates: async () => { throw new Error("Update checks are available in the Windows desktop app."); },
  openUpdateRelease: async () => false,
  openSupportDiscord: async () => window.open(SUPPORT_URL, "_blank", "noopener,noreferrer"),
  setReadingMode: async () => {},
  onNavigate: emptyListeners, onOpenDate: emptyListeners, onStateChanged: emptyListeners, onUpdateStatus: emptyListeners,
};

let mobileState;
let mobileWriteQueue = Promise.resolve();
let mobileScheduleQueue = Promise.resolve();
let mobileScheduleTimer = 0;
let mobileInitialized = false;
const navigateListeners = new Set();
const dateListeners = new Set();
const stateListeners = new Set();

async function readMobileState() {
  if (mobileState) return clone(mobileState);
  const { value } = await Preferences.get({ key: STATE_KEY });
  try {
    mobileState = normalizeState(value ? JSON.parse(value) : null);
  } catch {
    mobileState = defaultState();
  }
  await Preferences.set({ key: STATE_KEY, value: JSON.stringify(mobileState) });
  return clone(mobileState);
}

function writeMobileState(nextState, { reschedule = true } = {}) {
  mobileState = normalizeState(nextState);
  const snapshot = clone(mobileState);
  mobileWriteQueue = mobileWriteQueue.then(async () => {
    await Preferences.set({ key: STATE_KEY, value: JSON.stringify(snapshot) });
    stateListeners.forEach((listener) => listener(snapshot));
    return clone(snapshot);
  });
  if (reschedule) queueMobileReschedule();
  return mobileWriteQueue;
}

function queueMobileReschedule() {
  window.clearTimeout(mobileScheduleTimer);
  mobileScheduleTimer = window.setTimeout(() => {
    const snapshot = clone(mobileState || defaultState());
    mobileScheduleQueue = mobileScheduleQueue
      .then(() => rescheduleMobileNotifications(snapshot))
      .catch((error) => console.error(`${mobileSystemName} reminders could not be refreshed.`, error));
  }, 120);
}

function notificationBase(settings, id, kind, extra = {}) {
  const definition = reminderNotificationDefinition(kind, settings.notificationSound);
  const notification = {
    id,
    title: definition.title,
    body: definition.body,
    autoCancel: true,
    extra: { view: definition.view, kind, ...extra },
  };
  if (isNativeAndroid) notification.channelId = definition.channelId;
  if (isNativeIos && settings.notificationSound) notification.sound = "";
  return notification;
}

async function ensureNotificationChannels() {
  if (!isNativeAndroid) return;
  await LocalNotifications.deleteChannel({ id: LEGACY_SILENT_CHANNEL_ID }).catch(() => {});
  for (const channel of reminderNotificationChannels()) {
    await LocalNotifications.createChannel(channel).catch(() => {});
  }
}

async function notificationPermission(request = false) {
  let permission = await LocalNotifications.checkPermissions();
  if (request && permission.display === "prompt") permission = await LocalNotifications.requestPermissions();
  return permission.display === "granted";
}

async function exactNotificationPermission() {
  if (!isNativeAndroid) return false;
  const permission = await LocalNotifications.checkExactNotificationSetting().catch(() => ({ exact_alarm: "denied" }));
  return permission.exact_alarm === "granted";
}

async function cancelManagedNotifications() {
  const pending = await LocalNotifications.getPending().catch(() => ({ notifications: [] }));
  const managed = pending.notifications
    .filter(({ id }) => id >= NOTIFICATION_ID_START && id <= NOTIFICATION_ID_END)
    .map(({ id }) => ({ id }));
  if (managed.length) await LocalNotifications.cancel({ notifications: managed });
}

async function rescheduleMobileNotifications(state, { requestPermission = false } = {}) {
  if (!isNativeMobile) return;
  await cancelManagedNotifications();
  const settings = state.settings;
  if (!settings.notificationsEnabled || !settings.activeDays.length) return;
  if (!(await notificationPermission(requestPermission))) return;
  await ensureNotificationChannels();

  const notifications = [];
  const notificationLimit = mobileNotificationLimit(nativePlatformName);
  let id = NOTIFICATION_ID_START;
  if (Number(state.remindAt) > Date.now()) {
    notifications.push({
      ...notificationBase(settings, id++, "remind-later"),
      schedule: { at: new Date(state.remindAt), allowWhileIdle: true },
    });
  }

  const schedulingStart = new Date(Math.max(Date.now(), Number(state.snoozeUntil) || 0));
  const dates = settings.reminderMode === "times"
    ? nextSpecificDates(settings, schedulingStart, notificationLimit)
    : nextIntervalDates(settings, schedulingStart, notificationLimit);
  const availableSlots = Math.min(notificationLimit - notifications.length, NOTIFICATION_ID_END - id + 1);
  for (const at of dates.slice(0, Math.max(0, availableSlots))) {
    const kind = settings.reminderMode === "times" ? "daily-reading" : "devotional-timer";
    notifications.push({
      ...notificationBase(settings, id++, kind),
      schedule: { at, allowWhileIdle: true },
    });
  }

  if (notifications.length) await LocalNotifications.schedule({ notifications });
}

function pickBackupFile() {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.style.display = "none";
    document.body.append(input);
    input.addEventListener("change", () => {
      const file = input.files?.[0] || null;
      input.remove();
      resolve(file);
    }, { once: true });
    input.click();
  });
}

async function initializeMobile() {
  if (mobileInitialized) return;
  mobileInitialized = true;
  await StatusBar.setStyle({ style: isNativeIos ? Style.Light : Style.Dark }).catch(() => {});
  if (isNativeAndroid) await StatusBar.setBackgroundColor({ color: "#161a15" }).catch(() => {});
  await ensureNotificationChannels();
  await LocalNotifications.addListener("localNotificationActionPerformed", ({ notification }) => {
    const date = notification?.extra?.date;
    if (date) dateListeners.forEach((listener) => listener(date));
    else navigateListeners.forEach((listener) => listener(notification?.extra?.view || "today"));
  });
  await CapacitorApp.addListener("appStateChange", async ({ isActive }) => {
    if (isActive) {
      await readMobileState();
      queueMobileReschedule();
    }
  });
  if (isNativeAndroid) {
    await CapacitorApp.addListener("backButton", ({ canGoBack }) => {
      if (!canGoBack) navigateListeners.forEach((listener) => listener("back"));
    });
  }
}

const mobilePlatform = {
  platform: nativePlatformName,
  isMobile: true,
  minimize() {}, close() {}, setMode() {},
  exitApp: () => isNativeAndroid ? CapacitorApp.exitApp() : undefined,
  setReadingMode: async (active) => {
    if (active) {
      await StatusBar.hide().catch(() => {});
      return;
    }
    await StatusBar.show().catch(() => {});
    await StatusBar.setStyle({ style: isNativeIos ? Style.Light : Style.Dark }).catch(() => {});
    if (isNativeAndroid) await StatusBar.setBackgroundColor({ color: "#161a15" }).catch(() => {});
  },
  getPosition: async () => {
    let permission = await Geolocation.checkPermissions().catch(() => ({ coarseLocation: "prompt", location: "prompt" }));
    const requestedPermission = isNativeAndroid ? "coarseLocation" : "location";
    if (permission[requestedPermission] === "prompt") {
      permission = await Geolocation.requestPermissions({ permissions: [requestedPermission] });
    }
    if (permission.coarseLocation !== "granted" && permission.location !== "granted") throw new Error("Location permission was not granted.");
    const { coords } = await Geolocation.getCurrentPosition({ enableHighAccuracy: false, maximumAge: 24 * 60 * 60 * 1000, timeout: 5000 });
    return { latitude: coords.latitude, longitude: coords.longitude };
  },
  getState: async () => {
    await initializeMobile();
    let state = await readMobileState();
    if (state.settings.notificationsEnabled && !(await notificationPermission(true))) {
      state = normalizeState({ ...state, settings: { ...state.settings, notificationsEnabled: false } });
      mobileState = state;
      await Preferences.set({ key: STATE_KEY, value: JSON.stringify(state) });
    }
    queueMobileReschedule();
    return state;
  },
  updateSettings: async (patch) => {
    const state = await readMobileState();
    const settings = normalizeSettings({ ...state.settings, ...patch });
    const next = { ...state, settings };
    if (!settings.activeDays.length) Object.assign(next, { remindAt: 0, snoozeUntil: 0 });
    if (patch.notificationsEnabled && !(await notificationPermission(true))) {
      throw new Error(`${mobileSystemName} notification permission was not granted. Enable it in system Settings to use reminders.`);
    }
    return writeMobileState(next);
  },
  updateState: async (patch) => writeMobileState({ ...(await readMobileState()), ...patch }, { reschedule: false }),
  migrateLegacy: async () => readMobileState(),
  snooze: async (snoozeUntil) => writeMobileState({ ...(await readMobileState()), snoozeUntil: Math.max(0, Number(snoozeUntil) || 0), remindAt: 0 }),
  remindLater: async (remindAt) => {
    const state = await readMobileState();
    if (!state.settings.activeDays.length) throw new Error("Select at least one active reminder day first.");
    if (!state.settings.notificationsEnabled) throw new Error("Enable notifications before setting a reminder.");
    if (!(await notificationPermission(true))) throw new Error(`${mobileSystemName} notification permission is required for reminders.`);
    const until = Math.max(Date.now() + 1_000, Number(remindAt) || 0);
    return writeMobileState({ ...state, remindAt: until, snoozeUntil: until });
  },
  testNotification: async (requestedKind = "test") => {
    if (!(await notificationPermission(true))) return { supported: false };
    const state = await readMobileState();
    const kind = Object.prototype.hasOwnProperty.call(TEST_NOTIFICATION_IDS, requestedKind) ? requestedKind : "test";
    await ensureNotificationChannels();
    await LocalNotifications.schedule({ notifications: [{
      ...notificationBase(state.settings, TEST_NOTIFICATION_IDS[kind], kind),
      schedule: { at: new Date(Date.now() + 750) },
    }] });
    return { supported: true, kind };
  },
  requestExactNotificationPermission: async () => {
    if (!isNativeAndroid) return { granted: false, supported: false };
    const permission = await LocalNotifications.changeExactNotificationSetting();
    const granted = permission.exact_alarm === "granted";
    if (granted) await rescheduleMobileNotifications(await readMobileState());
    return { granted };
  },
  openDataFolder: async () => `Work Day with God keeps its data private inside ${mobileSystemName} app storage.`,
  exportData: async () => {
    const state = await readMobileState();
    const filename = `work-day-with-god-backup-${new Date().toISOString().slice(0, 10)}.json`;
    const written = await Filesystem.writeFile({
      path: filename,
      data: JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), state }, null, 2),
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    });
    await Share.share({ title: "Work Day with God backup", text: "Private local backup", files: [written.uri], dialogTitle: "Save or share backup" });
    return { canceled: false, path: written.uri };
  },
  importData: async () => {
    const file = await pickBackupFile();
    if (!file) return { canceled: true };
    const parsed = JSON.parse(await file.text());
    const candidate = parsed?.state || parsed;
    if (!candidate || typeof candidate !== "object" || !candidate.settings) throw new Error("That file is not a valid Work Day with God backup.");
    const state = await writeMobileState(candidate);
    return { canceled: false, state };
  },
  resetHistory: async () => writeMobileState({ ...(await readMobileState()), completions: {}, readingPositions: {} }, { reschedule: false }),
  resetFavourites: async () => writeMobileState({ ...(await readMobileState()), favourites: [] }, { reschedule: false }),
  resetAll: async () => writeMobileState(defaultState()),
  getAppInfo: async () => {
    await initializeMobile();
    const info = await CapacitorApp.getInfo();
    return {
      version: info.version,
      build: info.build,
      notificationSupported: await notificationPermission(false),
      exactNotificationSupported: await exactNotificationPermission(),
      platform: nativePlatformName,
      mobile: true,
    };
  },
  getUpdateStatus: async () => ({ currentVersion: (await CapacitorApp.getInfo()).version, latestVersion: "", updateAvailable: false, checking: false, supported: false }),
  checkForUpdates: async () => { throw new Error(isNativeIos ? "iOS updates are delivered through TestFlight or the App Store." : "Android updates are delivered with a new APK or through Google Play."); },
  openUpdateRelease: async () => false,
  openSupportDiscord: async () => Browser.open({ url: SUPPORT_URL }),
  onNavigate: (listener) => { navigateListeners.add(listener); return () => navigateListeners.delete(listener); },
  onOpenDate: (listener) => { dateListeners.add(listener); return () => dateListeners.delete(listener); },
  onStateChanged: (listener) => { stateListeners.add(listener); return () => stateListeners.delete(listener); },
  onUpdateStatus: emptyListeners,
};

const desktopPlatform = window.desktop ? {
  ...window.desktop,
  platform: "windows",
  isMobile: false,
  exitApp() {},
  setReadingMode: async () => {},
  getPosition: browserPosition,
  getAppInfo: async () => ({ ...(await window.desktop.getAppInfo()), platform: "windows", mobile: false }),
} : null;

export const platform = desktopPlatform || (isNativeMobile ? mobilePlatform : browserPlatform);
