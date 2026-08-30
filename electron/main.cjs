const { app, BrowserWindow, ipcMain, screen, Tray, Menu, Notification, nativeImage, shell, dialog, net } = require("electron");
const { autoUpdater } = require("electron-updater");
const fs = require("fs");
const path = require("path");
const { AppStore } = require("./store.cjs");
const { ReminderScheduler } = require("./scheduler.cjs");
const { compareVersions, fetchLatestRelease, isCheckDue, nextCheckAt, normalizeReleaseTag, releaseUrlForTag } = require("./update-checker.cjs");

const PACKAGED_APP_ID = "com.mcographics.workdaywithgod.windows";
const DEVELOPMENT_APP_ID = "com.mcographics.workdaywithgod.development";
const APP_ID = app.isPackaged ? PACKAGED_APP_ID : DEVELOPMENT_APP_ID;
const MAX_BACKUP_BYTES = 5 * 1024 * 1024;
const compactSize = { width: 440, height: 610 };
const readerSize = { width: 1040, height: 780 };
let mainWindow;
let tray;
let store;
let scheduler;
let updateCheckInFlight;
let updateStartupTimer;
let updateEvaluationTimer;
let updateLastAttemptAt = 0;
let updateLastError = "";
let updateInstallInFlight;
let updateRestartTimer;
let updateInstallState = {
  phase: "idle",
  percent: 0,
  bytesPerSecond: 0,
  transferred: 0,
  total: 0,
  error: "",
};
let isQuitting = false;
let devotionalCatalogue = [];

app.setName("Work Day with God");
if (!app.isPackaged) {
  const developmentUserData = path.join(app.getPath("appData"), "Work Day with God Development");
  app.setPath("userData", developmentUserData);
  app.setPath("sessionData", path.join(developmentUserData, "Session Data"));
}
app.setAppUserModelId(APP_ID);
if (!app.requestSingleInstanceLock()) app.quit();

function sourceIconPath() {
  const iconFile = process.platform === "win32" ? path.join("build", "icon.ico") : "icon.png";
  return path.join(__dirname, "..", iconFile);
}

function applicationIcon() {
  const icon = nativeImage.createFromPath(sourceIconPath());
  if (icon.isEmpty()) throw new Error(`Application icon could not be loaded from ${sourceIconPath()}`);
  return icon;
}

function windowsShellIconPath() {
  return app.isPackaged ? path.join(process.resourcesPath, "icon.ico") : sourceIconPath();
}

function windowsRelaunchCommand() {
  const executable = `"${process.execPath}"`;
  return app.isPackaged ? executable : `${executable} "${app.getAppPath()}"`;
}

function applyWindowsAppDetails(window) {
  if (process.platform !== "win32") return;
  window.setAppDetails({
    appId: APP_ID,
    appIconPath: windowsShellIconPath(),
    appIconIndex: 0,
    relaunchCommand: windowsRelaunchCommand(),
    relaunchDisplayName: "Work Day with God",
  });
}

function todayId(date = new Date()) {
  return `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function configuredDisplayScale() {
  const configured = String(store?.get().settings.displayScale || "system");
  return configured === "system" ? 1 : Number(configured);
}

function scaledSize(size) {
  const scale = configuredDisplayScale();
  const configuredResolution = String(store?.get().settings.screenResolution || "system");
  if (configuredResolution !== "system") {
    const [width, height] = configuredResolution.split("x").map(Number);
    // Resolution is an explicit window size. Keep it independent from the
    // user's DPI preference so 1920x1080 always means 1920x1080.
    return { width, height };
  }
  return { width: Math.round(size.width * scale), height: Math.round(size.height * scale) };
}

function placeBottomRight(window, size) {
  const scaled = scaledSize(size);
  const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
  const { workArea } = display;
  window.setBounds({
    width: scaled.width,
    height: scaled.height,
    x: workArea.x + workArea.width - scaled.width - 28,
    y: workArea.y + workArea.height - scaled.height - 28,
  }, true);
}

function showWindow(view = "today") {
  if (!mainWindow) return;
  mainWindow.setIcon(applicationIcon());
  if (view === "settings") mainWindow.webContents.send("app:navigate", "settings");
  else mainWindow.webContents.send("app:navigate", "today");
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  applyWindowsAppDetails(mainWindow);
  mainWindow.focus();
}

function minimizeWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) return { state: "unavailable" };
  mainWindow.minimize();
  return { state: "minimized" };
}

function closeWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) return { state: "unavailable" };
  if (store?.get().settings.closeToTray !== false) {
    mainWindow.hide();
    return { state: "hidden" };
  }
  isQuitting = true;
  app.quit();
  return { state: "quitting" };
}

function createWindow() {
  mainWindow = new BrowserWindow({
    ...compactSize,
    frame: false,
    transparent: true,
    resizable: false,
    show: false,
    backgroundColor: "#00000000",
    title: "Work Day with God",
    icon: applicationIcon(),
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      webviewTag: false,
      devTools: !app.isPackaged,
      navigateOnDragDrop: false,
    },
  });
  mainWindow.setIcon(applicationIcon());
  applyWindowsAppDetails(mainWindow);

  placeBottomRight(mainWindow, compactSize);
  const devUrl = process.env.VITE_DEV_SERVER_URL || "http://127.0.0.1:5183";
  if (!app.isPackaged) mainWindow.loadURL(devUrl);
  else mainWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  mainWindow.once("ready-to-show", () => {
    mainWindow.setIcon(applicationIcon());
    const settings = store.get().settings;
    if (settings.showStartupCard && !settings.startInTray) {
      mainWindow.show();
      applyWindowsAppDetails(mainWindow);
    }
  });
  mainWindow.on("close", (event) => {
    if (isQuitting) return;
    event.preventDefault();
    closeWindow();
  });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https:\/\/(worldenglish\.bible|www\.biblegateway\.com)\//.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });
  mainWindow.webContents.on("will-navigate", (event, url) => {
    const current = mainWindow.webContents.getURL();
    if (url !== current) event.preventDefault();
  });
  mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    callback(webContents === mainWindow.webContents && permission === "geolocation");
  });
  mainWindow.webContents.session.setPermissionCheckHandler((webContents, permission) => (
    webContents === mainWindow.webContents && permission === "geolocation"
  ));
}

function trayImage() {
  return applicationIcon().resize({ width: 20, height: 20, quality: "best" });
}

function setSnooze(until) {
  store.patchState({ snoozeUntil: until });
  rebuildTray();
  mainWindow?.webContents.send("app:state-changed", store.get());
}

function rebuildTray() {
  if (!tray) return;
  const status = scheduler?.status();
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: "Open", click: () => showWindow("today") },
    { label: "Settings", click: () => showWindow("settings") },
    { type: "separator" },
    { label: "Quit", click: () => { isQuitting = true; app.quit(); } },
  ]));
  tray.setToolTip(status?.paused ? "Work Day with God — reminders paused" : "Work Day with God");
}

function createTray() {
  tray = new Tray(trayImage());
  tray.on("double-click", () => showWindow("today"));
  rebuildTray();
}

function notify(date) {
  const settings = store.get().settings;
  if (!settings.notificationsEnabled || !Notification.isSupported()) return;
  const devotional = devotionalCatalogue.find((item) => item.id === todayId(date));
  const notification = new Notification({
    title: devotional?.reference || "A quiet moment with God",
    body: devotional?.verse || "Pause for today’s Scripture and reflection.",
    silent: !settings.notificationSound,
  });
  notification.on("click", () => {
    showWindow("today");
    mainWindow.webContents.send("app:open-date", todayId(date));
  });
  notification.show();
}

function updateStatus() {
  const state = store.get();
  const currentVersion = app.getVersion();
  const latestTag = normalizeReleaseTag(state.updateLatestTag);
  let updateAvailable = false;
  if (latestTag) {
    try { updateAvailable = compareVersions(latestTag, currentVersion) > 0; } catch {}
  }
  return {
    currentVersion,
    latestTag,
    latestVersion: latestTag.replace(/^v/i, ""),
    updateAvailable,
    releaseUrl: releaseUrlForTag(latestTag),
    lastCheckedAt: state.updateLastCheckedAt,
    nextCheckAt: nextCheckAt(state.settings.updateCheckFrequency, state.updateLastCheckedAt),
    frequency: state.settings.updateCheckFrequency,
    checking: Boolean(updateCheckInFlight),
    installSupported: app.isPackaged && process.platform === "win32",
    installPhase: updateInstallState.phase,
    downloadPercent: updateInstallState.percent,
    bytesPerSecond: updateInstallState.bytesPerSecond,
    transferred: updateInstallState.transferred,
    total: updateInstallState.total,
    error: updateInstallState.error || updateLastError,
  };
}

function sendUpdateStatus() {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send("updates:status", updateStatus());
}

function notifyUpdateAvailable(status) {
  if (!app.isPackaged || !Notification.isSupported()) return;
  const notification = new Notification({
    title: "Work Day with God update available",
    body: `Version ${status.latestVersion} is ready to download from GitHub.`,
    icon: applicationIcon(),
    silent: true,
  });
  notification.on("click", () => shell.openExternal(status.releaseUrl));
  notification.show();
}

async function checkForUpdates({ manual = false } = {}) {
  const before = store.get();
  if (!manual && !isCheckDue(before.settings.updateCheckFrequency, before.updateLastCheckedAt)) return updateStatus();
  if (!manual && Date.now() - updateLastAttemptAt < 15 * 60 * 1000) return updateStatus();
  if (updateCheckInFlight) return updateCheckInFlight;
  updateLastAttemptAt = Date.now();
  const operation = (async () => {
    try {
      const result = await fetchLatestRelease({ fetchImpl: net.fetch, currentVersion: app.getVersion() });
      const shouldNotify = result.updateAvailable && before.updateNotifiedTag !== result.latestTag;
      store.patchState({
        updateLastCheckedAt: result.checkedAt,
        updateLatestTag: result.latestTag,
        updateNotifiedTag: shouldNotify ? result.latestTag : before.updateNotifiedTag,
      });
      const status = updateStatus();
      if (shouldNotify) notifyUpdateAvailable(status);
      return { ...status, checking: false };
    } catch (error) {
      updateLastError = error?.message || "Unable to check GitHub for updates.";
      throw new Error(updateLastError);
    } finally {
      if (updateCheckInFlight === operation) updateCheckInFlight = null;
      sendUpdateStatus();
    }
  })();
  updateCheckInFlight = operation;
  updateLastError = "";
  sendUpdateStatus();
  return operation;
}

function updateInstallerError(error) {
  const message = String(error?.message || "Unable to download and install the update.");
  if (/latest\.yml|cannot find.*release|404/i.test(message)) {
    return "This GitHub release is missing its automatic-update file. Use View on GitHub for this release.";
  }
  if (/sha512|checksum|signature/i.test(message)) {
    return "The downloaded update could not be verified, so it was not installed.";
  }
  return message;
}

function setUpdateInstallState(patch) {
  updateInstallState = { ...updateInstallState, ...patch };
  sendUpdateStatus();
}

function configureAutoUpdater() {
  if (!app.isPackaged || process.platform !== "win32") return;
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = false;
  autoUpdater.allowPrerelease = false;
  autoUpdater.on("download-progress", (progress) => {
    setUpdateInstallState({
      phase: "downloading",
      percent: Math.max(0, Math.min(100, Number(progress?.percent) || 0)),
      bytesPerSecond: Math.max(0, Number(progress?.bytesPerSecond) || 0),
      transferred: Math.max(0, Number(progress?.transferred) || 0),
      total: Math.max(0, Number(progress?.total) || 0),
      error: "",
    });
  });
  autoUpdater.on("update-downloaded", () => {
    setUpdateInstallState({ phase: "downloaded", percent: 100, error: "" });
    clearTimeout(updateRestartTimer);
    updateRestartTimer = setTimeout(() => {
      setUpdateInstallState({ phase: "installing", percent: 100, error: "" });
      updateRestartTimer = setTimeout(() => {
        isQuitting = true;
        autoUpdater.quitAndInstall(true, true);
      }, 1_000);
    }, 500);
  });
  autoUpdater.on("error", (error) => {
    setUpdateInstallState({ phase: "error", error: updateInstallerError(error) });
  });
}

async function installLatestRelease() {
  const status = updateStatus();
  if (!status.installSupported) throw new Error("Automatic installation is available in the packaged Windows app.");
  if (updateInstallInFlight) return updateInstallInFlight;

  const operation = (async () => {
    try {
      setUpdateInstallState({
        phase: "checking",
        percent: 0,
        bytesPerSecond: 0,
        transferred: 0,
        total: 0,
        error: "",
      });
      const latestStatus = await checkForUpdates({ manual: true });
      if (!latestStatus.updateAvailable) {
        setUpdateInstallState({ phase: "idle", percent: 0, error: "" });
        return { ...updateStatus(), alreadyLatest: true };
      }
      setUpdateInstallState({ phase: "preparing", percent: 0, error: "" });
      const result = await autoUpdater.checkForUpdates();
      const availableVersion = normalizeReleaseTag(result?.updateInfo?.version);
      if (!availableVersion || compareVersions(availableVersion, app.getVersion()) <= 0) {
        throw new Error("GitHub did not return a newer installable Windows release.");
      }
      setUpdateInstallState({ phase: "downloading", error: "" });
      await autoUpdater.downloadUpdate();
      return updateStatus();
    } catch (error) {
      const friendlyError = updateInstallerError(error);
      setUpdateInstallState({ phase: "error", error: friendlyError });
      throw new Error(friendlyError);
    } finally {
      if (updateInstallInFlight === operation) updateInstallInFlight = null;
    }
  })();
  updateInstallInFlight = operation;
  return operation;
}

function runScheduledUpdateCheck() {
  checkForUpdates().catch(() => {});
}

function startUpdateChecks() {
  if (!app.isPackaged) return;
  updateStartupTimer = setTimeout(runScheduledUpdateCheck, 8_000);
  updateStartupTimer.unref?.();
  updateEvaluationTimer = setInterval(runScheduledUpdateCheck, 60 * 60 * 1000);
  updateEvaluationTimer.unref?.();
}

function applyLoginSetting(enabled) {
  if (!app.isPackaged || process.env.WDWG_DISABLE_LOGIN_REGISTRATION === "1") return;
  app.setLoginItemSettings({
    openAtLogin: Boolean(enabled),
    path: process.execPath,
    args: [],
  });
}

function assertTrustedIpcSender(event) {
  const trusted = mainWindow
    && !mainWindow.isDestroyed()
    && event.sender === mainWindow.webContents
    && event.senderFrame === mainWindow.webContents.mainFrame;
  if (!trusted) throw new Error("Rejected an untrusted application request.");
}

function handleTrusted(channel, handler) {
  ipcMain.handle(channel, (event, ...args) => {
    assertTrustedIpcSender(event);
    return handler(...args);
  });
}

function onTrusted(channel, handler) {
  ipcMain.on(channel, (event, ...args) => {
    assertTrustedIpcSender(event);
    handler(...args);
  });
}

function registerIpc() {
  handleTrusted("state:get", () => ({ ...store.get(), scheduler: scheduler.status() }));
  handleTrusted("settings:update", (patch) => {
    let state = store.patchSettings(patch);
    if (Object.prototype.hasOwnProperty.call(patch, "activeDays") && state.settings.activeDays.length === 0) {
      state = store.patchState({ remindAt: 0, snoozeUntil: 0 });
    }
    if (Object.prototype.hasOwnProperty.call(patch, "launchAtLogin")) applyLoginSetting(state.settings.launchAtLogin);
    if (Object.prototype.hasOwnProperty.call(patch, "updateCheckFrequency")) setTimeout(runScheduledUpdateCheck, 0);
    if ((Object.prototype.hasOwnProperty.call(patch, "displayScale") || Object.prototype.hasOwnProperty.call(patch, "screenResolution")) && mainWindow) {
      const mode = mainWindow.isResizable() ? "reader" : "card";
      const scale = configuredDisplayScale();
      mainWindow.setMinimumSize(mode === "reader" ? Math.round(800 * scale) : Math.round(compactSize.width * scale), mode === "reader" ? Math.round(640 * scale) : Math.round(compactSize.height * scale));
      placeBottomRight(mainWindow, mode === "reader" ? readerSize : compactSize);
    }
    rebuildTray();
    return { ...state, scheduler: scheduler.status() };
  });
  handleTrusted("state:update", (patch) => {
    const allowed = {};
    for (const key of ["favourites", "completions", "readingPositions"]) if (Object.prototype.hasOwnProperty.call(patch, key)) allowed[key] = patch[key];
    const state = store.patchState(allowed);
    return { ...state, scheduler: scheduler.status() };
  });
  handleTrusted("state:migrate", (legacy) => store.importLegacy(legacy));
  handleTrusted("reminders:snooze", (until) => {
    setSnooze(Math.max(0, Number(until) || 0));
    return scheduler.status();
  });
  handleTrusted("reminders:later", (until) => {
    const current = store.get();
    if (!current.settings.notificationsEnabled) throw new Error("Enable notifications in Settings to use Remind me later.");
    if (!current.settings.activeDays.length) throw new Error("Please select a day in Schedule style in Settings to start the timer.");
    const remindAt = Math.max(Date.now() + 60_000, Number(until) || 0);
    const state = store.patchState({ remindAt, snoozeUntil: remindAt });
    rebuildTray();
    mainWindow?.webContents.send("app:state-changed", state);
    return { ...state, scheduler: scheduler.status() };
  });
  handleTrusted("notifications:test", () => {
    if (!Notification.isSupported()) return { supported: false };
    const settings = store.get().settings;
    const testNotification = new Notification({
      title: "Work Day with God",
      body: "Your gentle reminders are working.",
      silent: !settings.notificationSound,
    });
    testNotification.on("click", () => showWindow("today"));
    testNotification.show();
    return { supported: true };
  });
  handleTrusted("data:open-folder", () => shell.openPath(app.getPath("userData")));
  handleTrusted("data:export", async () => {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: "Export Work Day with God data",
      defaultPath: path.join(app.getPath("documents"), "work-day-with-god-backup.json"),
      filters: [{ name: "JSON backup", extensions: ["json"] }],
    });
    if (result.canceled || !result.filePath) return { canceled: true };
    fs.writeFileSync(result.filePath, JSON.stringify(store.get(), null, 2), "utf8");
    return { canceled: false, filePath: result.filePath };
  });
  handleTrusted("data:import", async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: "Import Work Day with God data",
      properties: ["openFile"],
      filters: [{ name: "JSON backup", extensions: ["json"] }],
    });
    if (result.canceled || !result.filePaths[0]) return { canceled: true };
    const importPath = result.filePaths[0];
    if (fs.statSync(importPath).size > MAX_BACKUP_BYTES) throw new Error("That backup is larger than the 5 MB safety limit.");
    const imported = JSON.parse(fs.readFileSync(importPath, "utf8"));
    const state = store.replace(imported);
    applyLoginSetting(state.settings.launchAtLogin);
    rebuildTray();
    mainWindow.webContents.send("app:state-changed", state);
    return { canceled: false, state };
  });
  handleTrusted("data:reset-history", () => store.patchState({ completions: {}, readingPositions: {} }));
  handleTrusted("data:reset-favourites", () => store.patchState({ favourites: [] }));
  handleTrusted("data:reset-all", () => {
    const state = store.reset();
    applyLoginSetting(state.settings.launchAtLogin);
    rebuildTray();
    mainWindow.webContents.send("app:state-changed", state);
    return state;
  });
  handleTrusted("app:info", () => ({
    version: app.getVersion(),
    notificationSupported: Notification.isSupported(),
    userDataPath: app.getPath("userData"),
    displays: process.platform === "win32"
      ? screen.getAllDisplays().map((display, index) => ({
        id: String(display.id),
        name: `Display ${index + 1}`,
        width: display.size.width,
        height: display.size.height,
        scaleFactor: display.scaleFactor,
        workAreaWidth: display.workAreaSize.width,
        workAreaHeight: display.workAreaSize.height,
      }))
      : [],
  }));
  handleTrusted("updates:get-status", () => updateStatus());
  handleTrusted("updates:check", () => checkForUpdates({ manual: true }));
  handleTrusted("updates:install", () => installLatestRelease());
  handleTrusted("updates:open-release", () => {
    const status = updateStatus();
    return shell.openExternal(status.releaseUrl || "https://github.com/mcographics/WorkDaywithGod/releases/latest");
  });
  handleTrusted("support:discord", () => shell.openExternal("https://discord.gg/2UvdpY4JSW"));
  handleTrusted("window:minimize", minimizeWindow);
  handleTrusted("window:close", closeWindow);
  onTrusted("window:set-mode", (mode) => {
    if (!mainWindow) return;
    const size = mode === "reader" ? readerSize : compactSize;
    const scale = configuredDisplayScale();
    mainWindow.setMinimumSize(mode === "reader" ? Math.round(800 * scale) : Math.round(compactSize.width * scale), mode === "reader" ? Math.round(640 * scale) : Math.round(compactSize.height * scale));
    mainWindow.setResizable(mode === "reader");
    placeBottomRight(mainWindow, size);
  });
}

app.on("second-instance", () => showWindow("today"));
app.whenReady().then(() => {
  store = new AppStore(app.getPath("userData"));
  try {
    const cataloguePath = app.isPackaged
      ? path.join(__dirname, "..", "dist", "content", "devotionals.json")
      : path.join(app.getAppPath(), "public", "content", "devotionals.json");
    devotionalCatalogue = require(cataloguePath).devotionals || [];
  } catch {}
  registerIpc();
  createWindow();
  configureAutoUpdater();
  scheduler = new ReminderScheduler({ store, notify });
  scheduler.start();
  createTray();
  startUpdateChecks();
  applyLoginSetting(store.get().settings.launchAtLogin);
  screen.on("display-metrics-changed", () => {
    if (mainWindow && mainWindow.isVisible()) placeBottomRight(mainWindow, mainWindow.isResizable() ? readerSize : compactSize);
  });
  screen.on("display-removed", () => {
    if (mainWindow) placeBottomRight(mainWindow, mainWindow.isResizable() ? readerSize : compactSize);
  });
  screen.on("display-added", () => {
    if (mainWindow) placeBottomRight(mainWindow, mainWindow.isResizable() ? readerSize : compactSize);
  });
});

app.on("before-quit", () => {
  isQuitting = true;
  scheduler?.stop();
  clearTimeout(updateStartupTimer);
  clearInterval(updateEvaluationTimer);
  clearTimeout(updateRestartTimer);
});
app.on("window-all-closed", () => {});
