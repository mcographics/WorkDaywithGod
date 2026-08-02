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

test("daily anchors are encouraging and every devotional is explicitly Christ-centred", () => {
  const unsuitableDailyAnchor = /\b(?:smit\w*|smote|slay\w*|slain|slew|kill\w*|murder\w*|destr\w*|wrath|venge\w*|damn\w*|condemn\w*|punish\w*|curs\w*|accursed|sword|blood|hell|wicked\w*|evil|iniquit\w*|transgress\w*|sins?|sinners?|death|deaths|dead|die|dieth|dying|perish\w*|judg\w*|enemies|enemy|war|battle|terror|harlot|whore\w*|fornicat\w*|adulter\w*|drunken\w*|strong drink|idol\w*|belial|afflict\w*|tribulat\w*|persecut\w*|suffer\w*|sorrow\w*|grief|griev\w*|weep\w*|mourn\w*|betray\w*|crucif\w*|devil\w*|fool\w*|hate\w*|reproach\w*|stripes|prisons?|prisoner\w*|captiv\w*|contention|anger|angry|sham\w*|confusion|infirm\w*|sick\w*|diseases?|palsy|crying|rebuk\w*|rod|despis\w*|offen[cs]\w*|circumcision|loins|miserable|anathema|aliens?|strangers?|removed|lose|lost|deceiv\w*|wanton|boast\w*|false|scorn\w*|bind|pharaoh|egypt\w*|scatter\w*|whirlwind|graven|weari\w*|violence|wasting|bruise|satan|hardness|soldier|beaten|unlearned|ignorant|accus\w*|corrupt\w*|reprobat\w*|darken\w*|alienat\w*|ignorance|blindness|beware|scribes?|lies?|worshipped|creatures?|broken|wither\w*|fall\w*|schoolmaster|unknown|heathen|bowels|profane|babblings?|oppositions?|shipwreck|forbid\w*|abstain\w*|fight\w*|err\w*|overthrow\w*|lest|pitiful|armed|unjust\w*|plague|harden\w*|disobedient|trodden|dunghill|terrible|ass|woe)\b/i;
  const newTestamentBooks = new Set([
    "Matthew", "Mark", "Luke", "John", "Acts", "Romans", "1 Corinthians",
    "2 Corinthians", "Galatians", "Ephesians", "Philippians", "Colossians",
    "1 Thessalonians", "2 Thessalonians", "1 Timothy", "2 Timothy", "Titus",
    "Philemon", "Hebrews", "James", "1 Peter", "2 Peter", "1 John", "2 John",
    "3 John", "Jude", "Revelation",
  ]);
  const contextDependentReferences = new Set([
    "1 Thessalonians 2:6",
    "2 Thessalonians 1:7",
    "2 Corinthians 11:18",
    "2 Corinthians 12:15",
    "Isaiah 41:21",
    "Isaiah 43:4",
    "Jeremiah 32:19",
    "John 1:42",
    "John 12:43",
    "Luke 10:41",
    "Psalms 105:22",
    "Zechariah 9:1",
  ]);

  let newTestamentCount = 0;
  for (const item of catalogue) {
    assert.ok(!contextDependentReferences.has(item.reference), `${item.id} uses a context-dependent anchor: ${item.reference}`);
    assert.doesNotMatch(item.verse, /\?/, `${item.id} uses a context-dependent question: ${item.reference}`);
    assert.doesNotMatch(
      item.verse,
      /\b(?:not|no|neither|nor|without|against|but|if)\b/i,
      `${item.id} uses a context-dependent contrast: ${item.reference}`,
    );
    assert.doesNotMatch(item.verse, unsuitableDailyAnchor, `${item.id} uses an unsuitable daily anchor: ${item.reference}`);
    assert.match(
      [...item.reflection, item.prompt, item.prayer].join(" "),
      /\b(?:Jesus|Christ)\b/i,
      `${item.id} is not explicitly Christ-centred`,
    );
    const book = item.reference.replace(/\s+\d+:\d+$/, "");
    if (newTestamentBooks.has(book)) newTestamentCount += 1;
  }

  assert.ok(newTestamentCount >= 270, `Only ${newTestamentCount} New Testament anchors were selected`);
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
