const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const root = path.join(__dirname, "..");
const sceneRoot = path.join(root, "public", "scenes");
const libraryRoot = path.join(root, "scene-library");
const excludedFolders = new Set(["Black and White"]);

function calendarDays() {
  const days = [];
  for (let month = 0; month < 12; month += 1) {
    const count = new Date(2024, month + 1, 0).getDate();
    for (let day = 1; day <= count; day += 1) {
      days.push(`${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
    }
  }
  return days;
}

function naturalNumber(name) {
  return Number(name.match(/\((\d+)\)/)?.[1]) || Number.MAX_SAFE_INTEGER;
}

function selectSources(required) {
  const groups = fs.readdirSync(libraryRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !excludedFolders.has(entry.name))
    .map((entry) => ({
      category: entry.name,
      files: fs.readdirSync(path.join(libraryRoot, entry.name))
        .filter((name) => /\.(jpe?g|png|webp)$/i.test(name))
        .sort((a, b) => naturalNumber(a) - naturalNumber(b) || a.localeCompare(b))
        .map((name) => path.join(libraryRoot, entry.name, name)),
    }))
    .filter((group) => group.files.length);

  const selected = [];
  let round = 0;
  while (selected.length < required) {
    let added = false;
    for (const group of groups) {
      if (!group.files[round]) continue;
      selected.push({ category: group.category, file: group.files[round] });
      added = true;
      if (selected.length === required) break;
    }
    if (!added) break;
    round += 1;
  }
  if (selected.length < required) throw new Error(`Found only ${selected.length} usable library images; ${required} required.`);
  return selected;
}

async function main() {
  const days = calendarDays();
  const sources = selectSources(days.length);
  const assets = new Array(days.length);
  let cursor = 0;

  async function worker() {
    while (cursor < days.length) {
      const index = cursor++;
      const source = sources[index];
      const output = path.join(sceneRoot, `${days[index]}.webp`);
      await sharp(source.file)
        .rotate()
        .resize(1920, 1080, { fit: "cover", position: "attention", withoutEnlargement: false })
        .modulate({ brightness: 1.04, saturation: 1.12 })
        .webp({ quality: 78, effort: 4, smartSubsample: true })
        .toFile(output);
      const bytes = fs.readFileSync(output);
      assets[index] = {
        id: days[index], file: `${days[index]}.webp`, bytes: bytes.length,
        sha256: crypto.createHash("sha256").update(bytes).digest("hex"),
        category: source.category,
        source: path.relative(libraryRoot, source.file).replaceAll("\\", "/"),
      };
      process.stdout.write(`Built ${index + 1}/${days.length}: ${days[index]} from ${source.category}\n`);
    }
  }

  await Promise.all(Array.from({ length: 5 }, worker));
  const hashes = new Set(assets.map((asset) => asset.sha256));
  if (hashes.size !== days.length) throw new Error(`Expected ${days.length} unique scenes; found ${hashes.size}.`);
  fs.writeFileSync(path.join(sceneRoot, "manifest.json"), JSON.stringify({
    version: 3,
    source: "Bundled scene library",
    generatedAt: new Date().toISOString(),
    excludedFolders: [...excludedFolders],
    assets,
  }, null, 2));
  const total = assets.reduce((sum, asset) => sum + asset.bytes, 0);
  console.log(`Built ${assets.length} unique Verse Card scenes (${(total / 1024 / 1024).toFixed(1)} MB).`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
