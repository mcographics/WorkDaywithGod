const test = require("node:test");
const assert = require("node:assert/strict");

test("Android update checker selects the newest stable Android release and official APK", async () => {
  const { fetchLatestAndroidRelease, RELEASES_API_URL, compareAndroidVersions } = await import("../src/mobile-update-checker.mjs");
  let request;
  const result = await fetchLatestAndroidRelease({
    currentVersion: "1.0.2",
    now: 123456,
    fetchImpl: async (url, options) => {
      request = { url, options };
      return {
        ok: true,
        status: 200,
        headers: { get: () => "450" },
        text: async () => JSON.stringify([
          { tag_name: "android-v1.0.1", draft: false, prerelease: false, assets: [{ name: "Work-Day-with-God-Android-1.0.1.apk", size: 10 }] },
          { tag_name: "android-v1.0.3", draft: false, prerelease: false, assets: [{ name: "Work-Day-with-God-Android-1.0.3.apk", size: 20 }] },
          { tag_name: "android-v9.0.0", draft: false, prerelease: true, assets: [{ name: "Work-Day-with-God-Android-9.0.0.apk", size: 30 }] },
          { tag_name: "v99.0.0", draft: false, prerelease: false, assets: [] },
        ]),
      };
    },
  });
  assert.equal(request.url, RELEASES_API_URL);
  assert.equal(request.options.redirect, "error");
  assert.equal(result.latestTag, "android-v1.0.3");
  assert.equal(result.updateAvailable, true);
  assert.equal(result.apkName, "Work-Day-with-God-Android-1.0.3.apk");
  assert.equal(result.apkUrl, "https://github.com/mcographics/WorkDaywithGod/releases/download/android-v1.0.3/Work-Day-with-God-Android-1.0.3.apk");
  assert.equal(compareAndroidVersions("android-v1.0.3", "1.0.2"), 1);
});

test("Android update checker rejects unsafe, malformed, and oversized release data", async () => {
  const { fetchLatestAndroidRelease, normalizeAndroidReleaseTag } = await import("../src/mobile-update-checker.mjs");
  assert.equal(normalizeAndroidReleaseTag("../../malicious"), "");
  await assert.rejects(() => fetchLatestAndroidRelease({
    currentVersion: "1.0.2",
    fetchImpl: async () => ({ ok: true, status: 200, headers: { get: () => "3000000" }, text: async () => "[]" }),
  }), /unexpectedly large/);
  await assert.rejects(() => fetchLatestAndroidRelease({
    currentVersion: "1.0.2",
    fetchImpl: async () => ({
      ok: true,
      status: 200,
      headers: { get: () => "10" },
      text: async () => JSON.stringify([{ tag_name: "android-v1.0.3", draft: false, prerelease: false, assets: [{ name: "malicious.apk", size: 1 }] }]),
    }),
  }), /without its expected APK/);
});
