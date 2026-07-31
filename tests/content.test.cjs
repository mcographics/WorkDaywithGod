const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const sharp = require("sharp");

const root = path.join(__dirname, "..");
const catalogue = JSON.parse(fs.readFileSync(path.join(root, "public", "content", "devotionals.json"), "utf8")).devotionals;

test("catalogue covers every day in a leap year", () => {
  assert.equal(catalogue.length, 366);
  assert.equal(new Set(catalogue.map((item) => item.id)).size, 366);
  assert.ok(catalogue.some((item) => item.id === "02-29"));
  assert.ok(catalogue.some((item) => item.id === "12-31"));
});

test("catalogue includes the final valid day of every month", () => {
  const ids = new Set(catalogue.map((item) => item.id));
  for (let month = 0; month < 12; month += 1) {
    const finalDay = new Date(2024, month + 1, 0).getDate();
    const id = `${String(month + 1).padStart(2, "0")}-${String(finalDay).padStart(2, "0")}`;
    assert.ok(ids.has(id), `Missing final calendar date ${id}`);
  }
  for (const id of ["01-31", "03-31", "04-30", "05-31", "06-30", "07-31", "08-31", "09-30", "10-31", "11-30", "12-31"]) {
    assert.ok(ids.has(id), `Missing selectable 30th or 31st date ${id}`);
  }
});

test("daily content is complete and references are unique", () => {
  assert.equal(new Set(catalogue.map((item) => item.reference)).size, 366);
  for (const item of catalogue) {
    assert.ok(item.title && item.verse && item.reference && item.prompt && item.prayer);
    assert.equal(item.reflection.length, 3);
    assert.equal(item.image, `${item.id}.webp`);
  }
});

test("every reference exists in every bundled translation", () => {
  const files = ["kjv","asv","dbt","drb","erv","jps","wbt","ylt","geneva-bible1560"];
  for (const filename of files) {
    const bible = JSON.parse(fs.readFileSync(path.join(root, "public", "content", `${filename}.json`), "utf8"));
    for (const item of catalogue) {
      const match = item.reference.match(/^(.+?) (\d+):(\d+)$/);
      const book = bible.books.find((value) => value.name === match[1]);
      const chapter = book?.chapters.find((value) => value.number === Number(match[2]));
      assert.ok(chapter?.verses.some((value) => value.num === Number(match[3])), `${filename} missing ${item.reference}`);
    }
  }
});

test("every required scenic image exists and is reasonably sized", () => {
  for (const item of catalogue) {
    const file = path.join(root, "public", "scenes", item.image);
    assert.ok(fs.existsSync(file), `Missing ${item.image}`);
    const size = fs.statSync(file).size;
    assert.ok(size > 20_000 && size < 800_000, `${item.image} size ${size} is outside target`);
  }
});

test("scene manifest maps 366 unique decodable 1920 by 1080 WebP images", async () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "public", "scenes", "manifest.json"), "utf8"));
  assert.equal(manifest.assets.length, 366);
  assert.equal(new Set(manifest.assets.map((item) => item.id)).size, 366);
  assert.equal(new Set(manifest.assets.map((item) => item.sha256)).size, 366);
  for (const item of manifest.assets) {
    const metadata = await sharp(path.join(root, "public", "scenes", item.file)).metadata();
    assert.equal(metadata.format, "webp", `${item.file} is not WebP`);
    assert.equal(metadata.width, 1920, `${item.file} has incorrect width`);
    assert.equal(metadata.height, 1080, `${item.file} has incorrect height`);
  }
});
