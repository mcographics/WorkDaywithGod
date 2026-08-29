const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const mainSource = fs.readFileSync(path.join(root, "electron", "main.cjs"), "utf8");
const preloadSource = fs.readFileSync(path.join(root, "electron", "preload.cjs"), "utf8");
const updateCheckerSource = fs.readFileSync(path.join(root, "electron", "update-checker.cjs"), "utf8");
const appSource = fs.readFileSync(path.join(root, "src", "App.jsx"), "utf8");
const stylesSource = fs.readFileSync(path.join(root, "src", "styles.css"), "utf8");
const indexSource = fs.readFileSync(path.join(root, "index.html"), "utf8");
const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));

test("Electron window keeps restrictive renderer security settings", () => {
  for (const setting of [
    "contextIsolation: true",
    "nodeIntegration: false",
    "sandbox: true",
    "webSecurity: true",
    "allowRunningInsecureContent: false",
    "webviewTag: false",
    "navigateOnDragDrop: false",
  ]) assert.match(mainSource, new RegExp(setting.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});

test("navigation, permissions, and IPC senders are restricted", () => {
  assert.match(mainSource, /setWindowOpenHandler/);
  assert.match(mainSource, /will-navigate/);
  assert.match(mainSource, /setPermissionRequestHandler/);
  assert.match(mainSource, /setPermissionCheckHandler/);
  assert.match(mainSource, /assertTrustedIpcSender/);
  assert.doesNotMatch(preloadSource, /require\(["'](?:child_process|fs|net|http|https)["']\)/);
});

test("update checks keep networking and release navigation in the trusted main process", () => {
  assert.match(updateCheckerSource, /https:\/\/api\.github\.com\/repos\/mcographics\/WorkDaywithGod\/releases\/latest/);
  assert.match(updateCheckerSource, /redirect: "error"/);
  assert.match(updateCheckerSource, /MAX_RESPONSE_BYTES/);
  assert.match(mainSource, /fetchLatestRelease\(\{ fetchImpl: net\.fetch/);
  assert.match(mainSource, /handleTrusted\("updates:check"/);
  assert.match(mainSource, /handleTrusted\("updates:install"/);
  assert.match(mainSource, /handleTrusted\("updates:open-release"/);
  assert.match(mainSource, /autoUpdater\.autoDownload = false/);
  assert.match(mainSource, /autoUpdater\.on\("download-progress"/);
  assert.match(mainSource, /autoUpdater\.quitAndInstall\(true, true\)/);
  assert.match(mainSource, /shell\.openExternal\(status\.releaseUrl\)/);
  assert.match(preloadSource, /checkForUpdates: \(\) => ipcRenderer\.invoke\("updates:check"\)/);
  assert.match(preloadSource, /installUpdate: \(\) => ipcRenderer\.invoke\("updates:install"\)/);
  assert.match(preloadSource, /openUpdateRelease: \(\) => ipcRenderer\.invoke\("updates:open-release"\)/);
  assert.doesNotMatch(preloadSource, /api\.github\.com|releases\/tag/);
  assert.equal(packageJson.build.publish[0].provider, "github");
  assert.equal(packageJson.build.publish[0].owner, "mcographics");
  assert.equal(packageJson.build.publish[0].repo, "WorkDaywithGod");
});

test("Windows update installation has visible actions, progress, and restart guidance", () => {
  assert.match(appSource, /"Install latest"/);
  assert.match(appSource, /updateStatus\?\.installSupported && <button className="install-update-button"/);
  assert.match(appSource, /status\.alreadyLatest/);
  assert.match(appSource, />View on GitHub</);
  assert.match(appSource, /<progress aria-label="Windows update progress"/);
  assert.match(appSource, /shows its progress, closes Work Day with God, installs it silently, and relaunches the new version automatically/);
  assert.match(mainSource, /phase: "checking"/);
  assert.match(mainSource, /alreadyLatest: true/);
  assert.match(stylesSource, /\.update-progress progress/);
});

test("development startup uses a dedicated strict Vite port", () => {
  assert.match(mainSource, /http:\/\/127\.0\.0\.1:5183/);
  assert.match(packageJson.scripts.dev, /vite --host 127\.0\.0\.1 --port 5183 --strictPort/);
  assert.match(packageJson.scripts.dev, /wait-on http:\/\/127\.0\.0\.1:5183 && electron \./);
  assert.doesNotMatch(packageJson.scripts.dev, /127\.0\.0\.1:5173/);
  assert.match(mainSource, /if \(!app\.isPackaged\)/);
  assert.match(mainSource, /Work Day with God Development/);
  assert.match(mainSource, /app\.setPath\("userData"/);
  assert.match(mainSource, /app\.setPath\("sessionData"/);
});

test("Windows taskbar identity uses the multi-resolution application icon", () => {
  assert.match(mainSource, /process\.platform === "win32" \? path\.join\("build", "icon\.ico"\)/);
  assert.match(mainSource, /const PACKAGED_APP_ID = "com\.mcographics\.workdaywithgod\.windows"/);
  assert.match(mainSource, /const DEVELOPMENT_APP_ID = "com\.mcographics\.workdaywithgod\.development"/);
  assert.match(mainSource, /const APP_ID = app\.isPackaged \? PACKAGED_APP_ID : DEVELOPMENT_APP_ID/);
  assert.equal(packageJson.build.appId, "com.mcographics.workdaywithgod.windows");
  assert.notEqual(packageJson.build.appId, "com.mcographics.workdaywithgod.development");
  assert.deepEqual(packageJson.build.extraResources, [{ from: "build/icon.ico", to: "icon.ico" }]);
  assert.match(mainSource, /return app\.isPackaged \? path\.join\(process\.resourcesPath, "icon\.ico"\) : sourceIconPath\(\)/);
  assert.match(mainSource, /function applyWindowsAppDetails\(window\)/);
  assert.match(mainSource, /window\.setAppDetails\(\{/);
  assert.match(mainSource, /appId: APP_ID/);
  assert.match(mainSource, /appIconPath: windowsShellIconPath\(\)/);
  assert.match(mainSource, /appIconIndex: 0/);
  assert.match(mainSource, /relaunchCommand: windowsRelaunchCommand\(\)/);
  assert.match(mainSource, /relaunchDisplayName: "Work Day with God"/);
  assert.match(mainSource, /return app\.isPackaged \? executable : `\$\{executable\} "\$\{app\.getAppPath\(\)\}"`/);
  assert.ok(mainSource.match(/applyWindowsAppDetails\(mainWindow\)/g).length >= 3);
  assert.match(mainSource, /mainWindow\.show\(\);\s*applyWindowsAppDetails\(mainWindow\)/);
});

test("content security policy blocks remote scripts and embedded objects", () => {
  assert.match(indexSource, /default-src 'self'/);
  assert.match(indexSource, /script-src 'self'/);
  assert.match(indexSource, /object-src 'none'/);
  assert.match(indexSource, /base-uri 'none'/);
  assert.match(indexSource, /frame-src 'none'/);
});

test("PC display scaling is applied to both window modes", () => {
  assert.match(mainSource, /function scaledSize\(size\)/);
  assert.match(mainSource, /mainWindow\.isResizable\(\) \? "reader" : "card"/);
  assert.match(mainSource, /configuredDisplayScale/);
  assert.match(mainSource, /screenResolution/);
  assert.match(mainSource, /return \{ width, height \};/);
  assert.match(mainSource, /screen\.getAllDisplays\(\)/);
  assert.match(mainSource, /scaleFactor: display\.scaleFactor/);
  assert.match(appSource, /3840 × 2160/);
  assert.doesNotMatch(appSource, /5120 × 2880/);
});

test("packager uses an explicit application-file allowlist", () => {
  assert.deepEqual(packageJson.build.files, [
    "dist/**/*",
    "electron/**/*",
    "build/icon.png",
    "build/icon.ico",
    "icon.png",
    "package.json",
  ]);
  assert.equal(packageJson.build.asar, true);
});
