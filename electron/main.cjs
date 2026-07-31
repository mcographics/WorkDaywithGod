const { app, BrowserWindow, ipcMain, screen, Tray, Menu, Notification, nativeImage, shell, dialog } = require("electron");
const fs = require("fs");
const path = require("path");
const { AppStore } = require("./store.cjs");
const { ReminderScheduler } = require("./scheduler.cjs");

const APP_ID = "com.workdaywithgod.desktop";
const compactSize = { width: 440, height: 610 };
const readerSize = { width: 1040, height: 780 };
let mainWindow;
let tray;
let store;
let scheduler;
let isQuitting = false;
let devotionalCatalogue = [];

app.setAppUserModelId(APP_ID);
if (!app.requestSingleInstanceLock()) app.quit();

function sourceIconPath() {
  return path.join(__dirname, "..", "icon.png");
}

function windowsIconPath() {
  return path.join(__dirname, "..", "build", "icon.ico");
}

function todayId(date = new Date()) {
  return `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function placeBottomRight(window, size) {
  const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
  const { workArea } = display;
  window.setBounds({
    width: size.width,
    height: size.height,
    x: workArea.x + workArea.width - size.width - 28,
    y: workArea.y + workArea.height - size.height - 28,
  }, true);
}

function showWindow(view = "today") {
  if (!mainWindow) return;
  if (view === "settings") mainWindow.webContents.send("app:navigate", "settings");
  else mainWindow.webContents.send("app:navigate", "today");
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
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
    icon: windowsIconPath(),
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  placeBottomRight(mainWindow, compactSize);
  const devUrl = process.env.VITE_DEV_SERVER_URL || "http://127.0.0.1:5173";
  if (!app.isPackaged) mainWindow.loadURL(devUrl);
  else mainWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  mainWindow.once("ready-to-show", () => {
    const settings = store.get().settings;
    if (settings.showStartupCard && !settings.startInTray) mainWindow.show();
  });
  mainWindow.on("close", (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https:\/\/(worldenglish\.bible|www\.biblegateway\.com)\//.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });
  mainWindow.webContents.on("will-navigate", (event, url) => {
    const current = mainWindow.webContents.getURL();
    if (url !== current) event.preventDefault();
  });
}

function trayImage() {
  return nativeImage.createFromPath(sourceIconPath()).resize({ width: 20, height: 20 });
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

function applyLoginSetting(enabled) {
  if (!app.isPackaged || process.env.WDWG_DISABLE_LOGIN_REGISTRATION === "1") return;
  app.setLoginItemSettings({
    openAtLogin: Boolean(enabled),
    path: process.execPath,
    args: [],
  });
}

function registerIpc() {
  ipcMain.handle("state:get", () => ({ ...store.get(), scheduler: scheduler.status() }));
  ipcMain.handle("settings:update", (_event, patch) => {
    const state = store.patchSettings(patch);
    if (Object.prototype.hasOwnProperty.call(patch, "launchAtLogin")) applyLoginSetting(state.settings.launchAtLogin);
    rebuildTray();
    return { ...state, scheduler: scheduler.status() };
  });
  ipcMain.handle("state:update", (_event, patch) => {
    const allowed = {};
    for (const key of ["favourites", "completions", "readingPositions"]) if (Object.prototype.hasOwnProperty.call(patch, key)) allowed[key] = patch[key];
    const state = store.patchState(allowed);
    return { ...state, scheduler: scheduler.status() };
  });
  ipcMain.handle("state:migrate", (_event, legacy) => store.importLegacy(legacy));
  ipcMain.handle("reminders:snooze", (_event, until) => {
    setSnooze(Math.max(0, Number(until) || 0));
    return scheduler.status();
  });
  ipcMain.handle("reminders:later", (_event, until) => {
    const remindAt = Math.max(Date.now() + 60_000, Number(until) || 0);
    const state = store.patchState({ remindAt, snoozeUntil: remindAt });
    rebuildTray();
    mainWindow?.webContents.send("app:state-changed", state);
    return { ...state, scheduler: scheduler.status() };
  });
  ipcMain.handle("notifications:test", () => {
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
  ipcMain.handle("data:open-folder", () => shell.openPath(app.getPath("userData")));
  ipcMain.handle("data:export", async () => {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: "Export Work Day with God data",
      defaultPath: path.join(app.getPath("documents"), "work-day-with-god-backup.json"),
      filters: [{ name: "JSON backup", extensions: ["json"] }],
    });
    if (result.canceled || !result.filePath) return { canceled: true };
    fs.writeFileSync(result.filePath, JSON.stringify(store.get(), null, 2), "utf8");
    return { canceled: false, filePath: result.filePath };
  });
  ipcMain.handle("data:import", async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: "Import Work Day with God data",
      properties: ["openFile"],
      filters: [{ name: "JSON backup", extensions: ["json"] }],
    });
    if (result.canceled || !result.filePaths[0]) return { canceled: true };
    const imported = JSON.parse(fs.readFileSync(result.filePaths[0], "utf8"));
    const state = store.replace(imported);
    applyLoginSetting(state.settings.launchAtLogin);
    rebuildTray();
    mainWindow.webContents.send("app:state-changed", state);
    return { canceled: false, state };
  });
  ipcMain.handle("data:reset-history", () => store.patchState({ completions: {}, readingPositions: {} }));
  ipcMain.handle("data:reset-favourites", () => store.patchState({ favourites: [] }));
  ipcMain.handle("data:reset-all", () => {
    const state = store.reset();
    applyLoginSetting(state.settings.launchAtLogin);
    rebuildTray();
    mainWindow.webContents.send("app:state-changed", state);
    return state;
  });
  ipcMain.handle("app:info", () => ({
    version: app.getVersion(),
    notificationSupported: Notification.isSupported(),
    userDataPath: app.getPath("userData"),
  }));
  ipcMain.on("window:minimize", () => mainWindow?.minimize());
  ipcMain.on("window:close", () => mainWindow?.close());
  ipcMain.on("window:set-mode", (_event, mode) => {
    if (!mainWindow) return;
    const size = mode === "reader" ? readerSize : compactSize;
    mainWindow.setResizable(mode === "reader");
    if (mode === "reader") mainWindow.setMinimumSize(800, 640);
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
  scheduler = new ReminderScheduler({ store, notify });
  scheduler.start();
  createTray();
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
});
app.on("window-all-closed", () => {});
