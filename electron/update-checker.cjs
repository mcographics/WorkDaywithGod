const RELEASE_API_URL = "https://api.github.com/repos/mcographics/WorkDaywithGod/releases/latest";
const RELEASE_PAGE_ROOT = "https://github.com/mcographics/WorkDaywithGod/releases/tag/";
const MAX_RESPONSE_BYTES = 512 * 1024;
const CHECK_INTERVALS = Object.freeze({
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
  monthly: 30 * 24 * 60 * 60 * 1000,
});

function normalizeReleaseTag(value) {
  if (typeof value !== "string") return "";
  const tag = value.trim();
  return tag.length <= 80 && /^v?\d+\.\d+\.\d+(?:-?[0-9A-Za-z]+(?:[.-][0-9A-Za-z]+)*)?$/.test(tag) ? tag : "";
}

function parseVersion(value) {
  const normalized = normalizeReleaseTag(value).replace(/^v/i, "");
  const match = /^(\d+)\.(\d+)\.(\d+)(?:-?([0-9A-Za-z][0-9A-Za-z.-]*))?$/.exec(normalized);
  if (!match) return null;
  const core = match.slice(1, 4).map(Number);
  if (core.some((part) => !Number.isSafeInteger(part))) return null;
  return {
    core,
    prerelease: match[4] ? match[4].split(/[.-]/).filter(Boolean) : [],
  };
}

function compareVersions(left, right) {
  const a = parseVersion(left);
  const b = parseVersion(right);
  if (!a || !b) throw new Error("Unable to compare an invalid application version.");
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
    const aLower = aPart.toLowerCase();
    const bLower = bPart.toLowerCase();
    if (aLower === bLower) continue;
    return aLower > bLower ? 1 : -1;
  }
  return 0;
}

function releaseUrlForTag(tag) {
  const normalized = normalizeReleaseTag(tag);
  return normalized ? `${RELEASE_PAGE_ROOT}${encodeURIComponent(normalized)}` : "";
}

function isCheckDue(frequency, lastCheckedAt, now = Date.now()) {
  if (frequency === "never") return false;
  const interval = CHECK_INTERVALS[frequency];
  if (!interval) return false;
  const checkedAt = Number(lastCheckedAt) || 0;
  return checkedAt <= 0 || now - checkedAt >= interval;
}

function nextCheckAt(frequency, lastCheckedAt) {
  if (frequency === "never") return 0;
  const interval = CHECK_INTERVALS[frequency];
  const checkedAt = Number(lastCheckedAt) || 0;
  return interval && checkedAt > 0 ? checkedAt + interval : 0;
}

async function fetchLatestRelease({ fetchImpl, currentVersion, now = Date.now() }) {
  if (typeof fetchImpl !== "function") throw new Error("The update service is unavailable.");
  if (!parseVersion(currentVersion)) throw new Error("The installed application version is invalid.");
  const response = await fetchImpl(RELEASE_API_URL, {
    method: "GET",
    redirect: "error",
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2026-03-10",
    },
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error(`GitHub returned ${response.status} while checking for updates.`);
  const declaredLength = Number(response.headers?.get?.("content-length")) || 0;
  if (declaredLength > MAX_RESPONSE_BYTES) throw new Error("GitHub returned an unexpectedly large update response.");
  const text = await response.text();
  if (Buffer.byteLength(text, "utf8") > MAX_RESPONSE_BYTES) throw new Error("GitHub returned an unexpectedly large update response.");
  let payload;
  try { payload = JSON.parse(text); } catch { throw new Error("GitHub returned invalid update information."); }
  const latestTag = normalizeReleaseTag(payload?.tag_name);
  if (!latestTag || payload?.draft || payload?.prerelease) throw new Error("GitHub returned an invalid latest release.");
  return {
    checkedAt: now,
    currentVersion,
    latestTag,
    latestVersion: latestTag.replace(/^v/i, ""),
    updateAvailable: compareVersions(latestTag, currentVersion) > 0,
    releaseUrl: releaseUrlForTag(latestTag),
  };
}

module.exports = {
  CHECK_INTERVALS,
  RELEASE_API_URL,
  compareVersions,
  fetchLatestRelease,
  isCheckDue,
  nextCheckAt,
  normalizeReleaseTag,
  releaseUrlForTag,
};
