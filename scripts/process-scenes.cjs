const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const root = path.join(__dirname, "..");
const source = process.argv[2];
if (!source || !fs.existsSync(source)) {
  console.error("Usage: node scripts/process-scenes.cjs <generated-image-directory>");
  process.exit(1);
}

const sources = fs.readdirSync(source)
  .filter((name) => name.endsWith(".png"))
  .map((name) => ({ name, path: path.join(source, name), stat: fs.statSync(path.join(source, name)) }))
  .filter((item) => item.stat.size > 500_000)
  .sort((a, b) => a.stat.mtimeMs - b.stat.mtimeMs);
if (sources.length < 24) throw new Error(`At least 24 generated scenic sources are required; found ${sources.length}.`);

const dates = [];
for (let month = 0; month < 12; month += 1) {
  const days = new Date(2024, month + 1, 0).getDate();
  for (let day = 1; day <= days; day += 1) dates.push(`${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
}

const positions = ["centre", "north", "south", "east", "west", "northeast", "northwest", "southeast", "southwest"];
const seasonalGrade = [
  { brightness: .92, saturation: .78, hue: 210 }, { brightness: .96, saturation: .84, hue: 205 },
  { brightness: 1.02, saturation: .94, hue: 75 }, { brightness: 1.04, saturation: 1.02, hue: 85 },
  { brightness: 1.06, saturation: 1.08, hue: 95 }, { brightness: 1.06, saturation: 1.04, hue: 82 },
  { brightness: 1.02, saturation: 1.03, hue: 70 }, { brightness: 1, saturation: 1.02, hue: 55 },
  { brightness: 1.01, saturation: 1.08, hue: 42 }, { brightness: .98, saturation: 1.12, hue: 30 },
  { brightness: .94, saturation: .9, hue: 22 }, { brightness: .9, saturation: .8, hue: 215 },
];

const destination = path.join(root, "public", "scenes");
fs.mkdirSync(destination, { recursive: true });

async function renderScene(index) {
  const [month, day] = dates[index].split("-").map(Number);
  const primary = sources[(index * 11 + month * 3) % sources.length];
  let secondary = sources[(index * 17 + day * 5 + 7) % sources.length];
  if (secondary.path === primary.path) secondary = sources[(sources.indexOf(secondary) + 1) % sources.length];
  const grade = seasonalGrade[month - 1];
  const position = positions[(index + day) % positions.length];
  const secondaryPosition = positions[(index * 3 + month) % positions.length];

  const overlay = await sharp(secondary.path)
    .resize(1920, 1080, { fit: "cover", position: secondaryPosition })
    .modulate({ brightness: grade.brightness, saturation: grade.saturation, hue: grade.hue })
    .blur(1.1 + (index % 3) * .25)
    .ensureAlpha(.11 + (index % 5) * .012)
    .png()
    .toBuffer();

  const shade = Buffer.from(
    `<svg width="1920" height="1080"><defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#111810" stop-opacity=".02"/><stop offset=".55" stop-color="#111810" stop-opacity=".05"/><stop offset="1" stop-color="#0b0f0a" stop-opacity=".38"/></linearGradient></defs><rect width="1920" height="1080" fill="url(#s)"/></svg>`,
  );
  const output = path.join(destination, `${dates[index]}.webp`);
  await sharp(primary.path)
    .resize(1920, 1080, { fit: "cover", position })
    .modulate({ brightness: grade.brightness, saturation: grade.saturation, hue: grade.hue + (index % 7) - 3 })
    .composite([{ input: overlay, blend: "soft-light" }, { input: shade, blend: "over" }])
    .webp({ quality: 74, effort: 4, smartSubsample: true })
    .toFile(output);

  const bytes = fs.readFileSync(output);
  return {
    id: dates[index],
    file: `${dates[index]}.webp`,
    bytes: bytes.length,
    sha256: crypto.createHash("sha256").update(bytes).digest("hex"),
    sources: [primary.name, secondary.name],
  };
}

async function processAll() {
  const assets = new Array(dates.length);
  let cursor = 0;
  async function worker() {
    while (cursor < dates.length) {
      const index = cursor++;
      assets[index] = await renderScene(index);
    }
  }
  await Promise.all(Array.from({ length: 4 }, worker));
  const hashes = new Set(assets.map((item) => item.sha256));
  if (hashes.size !== dates.length) throw new Error(`Expected ${dates.length} unique outputs, found ${hashes.size}.`);
  fs.writeFileSync(path.join(destination, "manifest.json"), JSON.stringify({ version: 1, sourceCount: sources.length, assets }, null, 2));
  const total = assets.reduce((sum, item) => sum + item.bytes, 0);
  console.log(`Processed ${assets.length} unique scenes from ${sources.length} generated sources (${(total / 1024 / 1024).toFixed(1)} MB).`);
}

processAll().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
