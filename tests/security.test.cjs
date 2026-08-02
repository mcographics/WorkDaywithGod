const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const mainSource = fs.readFileSync(path.join(root, "electron", "main.cjs"), "utf8");
const preloadSource = fs.readFileSync(path.join(root, "electron", "preload.cjs"), "utf8");
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

test("content security policy blocks remote scripts and embedded objects", () => {
  assert.match(indexSource, /default-src 'self'/);
  assert.match(indexSource, /script-src 'self'/);
  assert.match(indexSource, /object-src 'none'/);
  assert.match(indexSource, /base-uri 'none'/);
  assert.match(indexSource, /frame-src 'none'/);
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
