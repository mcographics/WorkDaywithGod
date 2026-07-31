const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const catalogue = JSON.parse(fs.readFileSync(path.join(root, "public", "content", "devotionals.json"), "utf8")).devotionals;

test("catalogue covers every day in a leap year", () => {
  assert.equal(catalogue.length, 366);
  assert.equal(new Set(catalogue.map((item) => item.id)).size, 366);
  assert.ok(catalogue.some((item) => item.id === "02-29"));
  assert.ok(catalogue.some((item) => item.id === "12-31"));
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
