const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktop", Object.freeze({
  minimize: () => ipcRenderer.send("window:minimize"),
  close: () => ipcRenderer.send("window:close"),
  setMode: (mode) => ipcRenderer.send("window:set-mode", mode === "reader" ? "reader" : "card"),
  getState: () => ipcRenderer.invoke("state:get"),
  updateSettings: (patch) => ipcRenderer.invoke("settings:update", patch),
  updateState: (patch) => ipcRenderer.invoke("state:update", patch),
  migrateLegacy: (legacy) => ipcRenderer.invoke("state:migrate", legacy),
  snooze: (until) => ipcRenderer.invoke("reminders:snooze", until),
  remindLater: (until) => ipcRenderer.invoke("reminders:later", until),
  testNotification: () => ipcRenderer.invoke("notifications:test"),
  openDataFolder: () => ipcRenderer.invoke("data:open-folder"),
  exportData: () => ipcRenderer.invoke("data:export"),
  importData: () => ipcRenderer.invoke("data:import"),
  resetHistory: () => ipcRenderer.invoke("data:reset-history"),
  resetFavourites: () => ipcRenderer.invoke("data:reset-favourites"),
  resetAll: () => ipcRenderer.invoke("data:reset-all"),
  getAppInfo: () => ipcRenderer.invoke("app:info"),
  openSupportDiscord: () => ipcRenderer.invoke("support:discord"),
  onNavigate: (callback) => {
    const handler = (_event, view) => callback(view);
    ipcRenderer.on("app:navigate", handler);
    return () => ipcRenderer.removeListener("app:navigate", handler);
  },
  onOpenDate: (callback) => {
    const handler = (_event, dateId) => callback(dateId);
    ipcRenderer.on("app:open-date", handler);
    return () => ipcRenderer.removeListener("app:open-date", handler);
  },
  onStateChanged: (callback) => {
    const handler = (_event, state) => callback(state);
    ipcRenderer.on("app:state-changed", handler);
    return () => ipcRenderer.removeListener("app:state-changed", handler);
  },
}));
