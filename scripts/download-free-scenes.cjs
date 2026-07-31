const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const root = path.join(__dirname, "..");
const destination = path.join(root, "public", "scenes");
const candidateCache = path.join(root, ".scene-candidates.json");
const api = "https://commons.wikimedia.org/w/api.php";
const searches = [
  "bright blue sky landscape", "sunny waterfall landscape", "colourful flower garden",
  "white dove blue sky", "turquoise lake mountains", "sunlit forest path",
  "tropical beach blue water", "spring meadow wildflowers", "cherry blossoms blue sky",
  "bright mountain valley", "rainbow waterfall", "sunrise lake reflection",
  "lavender field sunny", "botanical garden flowers", "ocean cliffs sunny",
  "river valley sunshine", "water lilies pond", "autumn landscape sunny",
  "snow mountains blue sky", "peaceful countryside sunshine", "magnolia flowers",
  "tulip field blue sky", "bright coastal landscape", "garden fountain flowers",
  "sunflower field blue sky", "colourful roses garden", "orchid flowers bright",
  "clear mountain stream sunny", "tropical flowers sunlight", "bright canyon landscape",
  "lotus flowers pond", "apple blossoms blue sky", "sunny vineyard landscape",
  "azure sea island", "rhododendron garden", "bright alpine meadow",
];
const allowedLicences = /^(CC0|Public domain|CC BY (?:2\.0|2\.5|3\.0|4\.0))$/i;
const unsuitableSubjects = /\b(night|milky way|moon|storm|fog|mist|cloudy|dark|winter|snow|black|grey|gray|cemetery|ruin|desert)\b/i;
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

function text(value = "") {
  return value.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").trim();
}

function dates() {
  const result = [];
  for (let month = 0; month < 12; month += 1) {
    const count = new Date(2024, month + 1, 0).getDate();
    for (let day = 1; day <= count; day += 1) {
      result.push(`${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
    }
  }
  return result;
}

async function searchCommons(query) {
  const params = new URLSearchParams({
    action: "query", format: "json", origin: "*", generator: "search",
    gsrsearch: `${query} filetype:bitmap`, gsrnamespace: "6", gsrlimit: "50",
    prop: "imageinfo", iiprop: "url|size|extmetadata", iiurlwidth: "1920",
  });
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = await fetch(`${api}?${params}`, {
      headers: { "User-Agent": "WorkDayWithGod/1.0 (free offline devotional app)" },
    });
    if (response.ok) {
      const payload = await response.json();
      return Object.values(payload.query?.pages || {});
    }
    if (response.status !== 429) throw new Error(`Commons search failed: ${response.status}`);
    await wait((attempt + 1) * 5000);
  }
  throw new Error("Commons search remained rate-limited after retries.");
}

async function collectCandidates() {
  const candidates = new Map();
  for (const query of searches) {
    process.stdout.write(`Searching Commons: ${query}\n`);
    const pages = await searchCommons(query);
    for (const page of pages) {
      const info = page.imageinfo?.[0];
      const meta = info?.extmetadata || {};
      const licence = text(meta.LicenseShortName?.value);
      const url = info?.thumburl || info?.url;
      if (!url || !allowedLicences.test(licence) || info.width < 1200 || info.height < 675) continue;
      candidates.set(page.pageid, {
        title: page.title.replace(/^File:/, ""),
        page: `https://commons.wikimedia.org/?curid=${page.pageid}`,
        url,
        author: text(meta.Artist?.value) || "Wikimedia Commons contributor",
        licence,
        licenceUrl: meta.LicenseUrl?.value || "https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia",
        description: text(meta.ImageDescription?.value),
      });
    }
    await wait(1100);
  }
  return [...candidates.values()];
}

async function download(candidate, id) {
  let input;
  for (let attempt = 0; attempt < 7; attempt += 1) {
    const downloadUrl = candidate.url.replace(/\/1920px-/, "/1280px-");
    const response = await fetch(downloadUrl, {
      headers: { "User-Agent": "WorkDayWithGod/1.0 (free offline devotional app)" },
    });
    if (response.ok) {
      input = Buffer.from(await response.arrayBuffer());
      break;
    }
    if (response.status !== 429) throw new Error(`Download failed: ${response.status}`);
    await wait((attempt + 1) * 6000);
  }
  if (!input) throw new Error("Image download remained rate-limited after retries.");
  const output = path.join(destination, `${id}.webp`);
  await sharp(input)
    .rotate()
    .resize(1920, 1080, { fit: "cover", position: "attention" })
    .modulate({ brightness: 1.08, saturation: 1.18 })
    .webp({ quality: 78, effort: 4, smartSubsample: true })
    .toFile(output);
  const bytes = fs.readFileSync(output);
  return {
    id, file: `${id}.webp`, bytes: bytes.length,
    sha256: crypto.createHash("sha256").update(bytes).digest("hex"),
    source: candidate.page, title: candidate.title, author: candidate.author,
    licence: candidate.licence, licenceUrl: candidate.licenceUrl,
  };
}

async function main() {
  fs.mkdirSync(destination, { recursive: true });
  const dayIds = dates();
  const collected = fs.existsSync(candidateCache)
    ? JSON.parse(fs.readFileSync(candidateCache, "utf8"))
    : await collectCandidates();
  if (!fs.existsSync(candidateCache)) fs.writeFileSync(candidateCache, JSON.stringify(collected, null, 2));
  const candidates = collected.filter((item) => !unsuitableSubjects.test(`${item.title} ${item.description || ""}`));
  if (candidates.length < dayIds.length) {
    throw new Error(`Only ${candidates.length} suitable freely licensed images found; ${dayIds.length} required.`);
  }

  // Spread subject matter throughout the calendar rather than grouping similar searches.
  candidates.sort((a, b) => a.title.localeCompare(b.title));
  const selected = dayIds.map((_, index) => candidates[(index * 137) % candidates.length]);
  const assets = new Array(dayIds.length);
  let cursor = 0;
  async function worker() {
    while (cursor < dayIds.length) {
      const index = cursor++;
      try {
        assets[index] = await download(selected[index], dayIds[index]);
        process.stdout.write(`Downloaded ${index + 1}/${dayIds.length}: ${dayIds[index]}\n`);
        await wait(650);
      } catch (error) {
        cursor = dayIds.length;
        throw error;
      }
    }
  }
  await Promise.all(Array.from({ length: 3 }, worker));

  fs.writeFileSync(path.join(destination, "manifest.json"), JSON.stringify({
    version: 2, provider: "Wikimedia Commons", generatedAt: new Date().toISOString(), assets,
  }, null, 2));
  const credits = [
    "# Scenic image credits",
    "",
    "These images were obtained from Wikimedia Commons and are bundled for offline use.",
    "Each entry retains its source, creator, and licence. Image crops and colour adjustments were made for the Verse Card.",
    "",
    ...assets.flatMap((item) => [
      `## ${item.id} — ${item.title}`,
      "",
      `- Creator: ${item.author}`,
      `- Source: ${item.source}`,
      `- Licence: [${item.licence}](${item.licenceUrl})`,
      "",
    ]),
  ].join("\n");
  fs.writeFileSync(path.join(destination, "ATTRIBUTIONS.md"), credits);
  const total = assets.reduce((sum, item) => sum + item.bytes, 0);
  console.log(`Installed ${assets.length} bright scenes (${(total / 1024 / 1024).toFixed(1)} MB).`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
