const test = require("node:test");
const assert = require("node:assert/strict");
const {
  CHECK_INTERVALS,
  RELEASE_API_URL,
  compareVersions,
  fetchLatestRelease,
  isCheckDue,
  nextCheckAt,
  normalizeReleaseTag,
  releaseUrlForTag,
} = require("../electron/update-checker.cjs");

test("version comparison treats the public 1.4.1a tag as the packaged 1.4.1-a version", () => {
  assert.equal(compareVersions("v1.4.1a", "1.4.1-a"), 0);
  assert.equal(compareVersions("v1.4.2", "1.4.1-a"), 1);
  assert.equal(compareVersions("v1.4.0", "1.4.1-a"), -1);
  assert.equal(compareVersions("1.4.1", "1.4.1-a"), 1);
  assert.equal(compareVersions("1.5.0-beta.2", "1.5.0-beta.1"), 1);
});

test("update check frequencies become due at daily, weekly, and thirty-day monthly boundaries", () => {
  const now = 2_000_000_000_000;
  assert.equal(isCheckDue("daily", 0, now), true);
  assert.equal(isCheckDue("daily", now - CHECK_INTERVALS.daily + 1, now), false);
  assert.equal(isCheckDue("daily", now - CHECK_INTERVALS.daily, now), true);
  assert.equal(isCheckDue("weekly", now - CHECK_INTERVALS.weekly, now), true);
  assert.equal(isCheckDue("monthly", now - CHECK_INTERVALS.monthly, now), true);
  assert.equal(isCheckDue("never", 0, now), false);
  assert.equal(nextCheckAt("weekly", now), now + CHECK_INTERVALS.weekly);
  assert.equal(nextCheckAt("never", now), 0);
});

test("latest release checks use only the fixed public GitHub endpoint and validated tag URL", async () => {
  let request;
  const result = await fetchLatestRelease({
    currentVersion: "1.4.1-a",
    now: 123456,
    fetchImpl: async (url, options) => {
      request = { url, options };
      return {
        ok: true,
        status: 200,
        headers: { get: () => "96" },
        text: async () => JSON.stringify({ tag_name: "v1.4.2", draft: false, prerelease: false }),
      };
    },
  });
  assert.equal(request.url, RELEASE_API_URL);
  assert.equal(request.options.method, "GET");
  assert.equal(request.options.redirect, "error");
  assert.equal(request.options.headers.Accept, "application/vnd.github+json");
  assert.equal(result.updateAvailable, true);
  assert.equal(result.latestVersion, "1.4.2");
  assert.equal(result.releaseUrl, "https://github.com/mcographics/WorkDaywithGod/releases/tag/v1.4.2");
  assert.equal(result.checkedAt, 123456);
});

test("release tags and response bodies are rejected when unsafe or malformed", async () => {
  assert.equal(normalizeReleaseTag("../../malicious"), "");
  assert.equal(releaseUrlForTag("https://example.com"), "");
  await assert.rejects(() => fetchLatestRelease({
    currentVersion: "1.4.1-a",
    fetchImpl: async () => ({
      ok: true,
      status: 200,
      headers: { get: () => "50" },
      text: async () => JSON.stringify({ tag_name: "../../malicious", draft: false, prerelease: false }),
    }),
  }), /invalid latest release/);
  await assert.rejects(() => fetchLatestRelease({
    currentVersion: "1.4.1-a",
    fetchImpl: async () => ({ ok: false, status: 403, headers: { get: () => "0" }, text: async () => "" }),
  }), /GitHub returned 403/);
});
