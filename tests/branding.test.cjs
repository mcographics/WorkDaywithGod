const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const icon = fs.readFileSync(path.join(__dirname, "..", "build", "icon.ico"));

test("Windows icon includes taskbar and high-DPI representations", () => {
  assert.equal(icon.readUInt16LE(0), 0);
  assert.equal(icon.readUInt16LE(2), 1);
  const count = icon.readUInt16LE(4);
  const entries = Array.from({ length: count }, (_, index) => {
    const offset = 6 + index * 16;
    return {
      width: icon[offset] || 256,
      height: icon[offset + 1] || 256,
      planes: icon.readUInt16LE(offset + 4),
      bits: icon.readUInt16LE(offset + 6),
      bytes: icon.readUInt32LE(offset + 8),
      imageOffset: icon.readUInt32LE(offset + 12),
    };
  });

  assert.deepEqual(entries.map(({ width }) => width), [16, 20, 24, 32, 40, 48, 64, 128, 256]);
  for (const entry of entries) {
    assert.equal(entry.height, entry.width);
    assert.equal(entry.planes, 1);
    assert.equal(entry.bits, 32);
    assert.ok(entry.bytes > 0);
    assert.equal(icon.subarray(entry.imageOffset, entry.imageOffset + 8).toString("hex"), "89504e470d0a1a0a");
  }
});
