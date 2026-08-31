const RELEASES_API_URL = "https://api.github.com/repos/mcographics/WorkDaywithGod/releases?per_page=100";
const RELEASE_PAGE_ROOT = "https://github.com/mcographics/WorkDaywithGod/releases/tag/";
const DOWNLOAD_ROOT = "https://github.com/mcographics/WorkDaywithGod/releases/download/";
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;
const MAX_RELEASES = 100;
const CHECK_INTERVALS = Object.freeze({
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
  monthly: 30 * 24 * 60 * 60 * 1000,
});

function normalizeAndroidReleaseTag(value) {
  if (typeof value !== "string") return "";
  const tag = value.trim();
  return /^android-v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(tag) && tag.length <= 80 ? tag : "";
}

function parseVersion(value) {
  const tag = normalizeAndroidReleaseTag(value).replace(/^android-v/i, "");
  const match = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z][0-9A-Za-z.-]*))?$/.exec(tag);
  if (!match) return null;
  return {
    core: match.slice(1, 4).map(Number),
    prerelease: match[4] ? match[4].split(/[.-]/).filter(Boolean) : [],
  };
}

export function compareAndroidVersions(left, right) {
  const a = parseVersion(`android-v${String(left).replace(/^android-v/i, "")}`);
  const b = parseVersion(`android-v${String(right).replace(/^android-v/i, "")}`);
  if (!a || !b) throw new Error("Unable to compare an invalid Android application version.");
  for (let index = 0; index < 3; index += 1) {
    if (a.core[index] !== b.core[index]) return a.core[index] > b.core[index] ? 1 : -1;
  }
  if (!a.prerelease.length && !b.prerelease.length) return 0;
  if (!a.prerelease.length) return 1;
  if (!b.prerelease.length) return -1;
  const length = Math.max(a.prerelease.length, b.prerelease.length);
  for (let index = 0; index < length; index += 1) {
    const aPart = a.prerelease[index];
    const bPart = b.prerelease[index];
    if (aPart === undefined) return -1;
    if (bPart === undefined) return 1;
    if (aPart === bPart) continue;
    const aNumeric = /^\d+$/.test(aPart);
    const bNumeric = /^\d+$/.test(bPart);
    if (aNumeric && bNumeric) return Number(aPart) > Number(bPart) ? 1 : -1;
    if (aNumeric !== bNumeric) return aNumeric ? -1 : 1;
    return aPart.toLowerCase() > bPart.toLowerCase() ? 1 : -1;
  }
  return 0;
}

export function isMobileCheckDue(frequency, lastCheckedAt, now = Date.now()) {
  if (frequency === "never") return false;
  const interval = CHECK_INTERVALS[frequency];
  const checkedAt = Number(lastCheckedAt) || 0;
  return Boolean(interval && (checkedAt <= 0 || now - checkedAt >= interval));
}

function releaseUrlForTag(tag) {
  const normalized = normalizeAndroidReleaseTag(tag);
  return normalized ? `${RELEASE_PAGE_ROOT}${encodeURIComponent(normalized)}` : "";
}

function expectedApkUrl(tag, name) {
  const version = tag.replace(/^android-v/i, "");
  const expectedName = `Work-Day-with-God-Android-${version}.apk`;
  if (name !== expectedName) return "";
  return `${DOWNLOAD_ROOT}${encodeURIComponent(tag)}/${encodeURIComponent(name)}`;
}

export async function fetchLatestAndroidRelease({ fetchImpl = globalThis.fetch, currentVersion, now = Date.now() } = {}) {
  if (typeof fetchImpl !== "function") throw new Error("The Android update service is unavailable.");
  if (!parseVersion(`android-v${currentVersion}`)) throw new Error("The installed Android application version is invalid.");
  const response = await fetchImpl(RELEASES_API_URL, {
    method: "GET",
    redirect: "error",
    headers: { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" },
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error(`GitHub returned ${response.status} while checking Android updates.`);
  const declaredLength = Number(response.headers?.get?.("content-length")) || 0;
  if (declaredLength > MAX_RESPONSE_BYTES) throw new Error("GitHub returned an unexpectedly large Android update response.");
  const text = await response.text();
  if (new TextEncoder().encode(text).byteLength > MAX_RESPONSE_BYTES) throw new Error("GitHub returned an unexpectedly large Android update response.");
  let releases;
  try { releases = JSON.parse(text); } catch { throw new Error("GitHub returned invalid Android update information."); }
  if (!Array.isArray(releases) || releases.length > MAX_RELEASES) throw new Error("GitHub returned an invalid Android release list.");
  const candidates = releases.filter((release) => normalizeAndroidReleaseTag(release?.tag_name) && !release?.draft && !release?.prerelease);
  candidates.sort((left, right) => compareAndroidVersions(right.tag_name, left.tag_name));
  const release = candidates[0];
  const latestTag = normalizeAndroidReleaseTag(release?.tag_name);
  const apk = release?.assets?.find((asset) => asset?.name === `Work-Day-with-God-Android-${latestTag.replace(/^android-v/i, "")}.apk`);
  const apkUrl = expectedApkUrl(latestTag, apk?.name);
  if (!release || !latestTag || !apkUrl) throw new Error("GitHub returned an Android release without its expected APK.");
  return {
    checkedAt: now,
    currentVersion: String(currentVersion),
    latestTag,
    latestVersion: latestTag.replace(/^android-v/i, ""),
    updateAvailable: compareAndroidVersions(latestTag, currentVersion) > 0,
    releaseUrl: releaseUrlForTag(latestTag),
    apkUrl,
    apkName: apk.name,
    apkSize: Number(apk.size) || 0,
  };
}

export { CHECK_INTERVALS, RELEASES_API_URL, expectedApkUrl, normalizeAndroidReleaseTag, releaseUrlForTag };
