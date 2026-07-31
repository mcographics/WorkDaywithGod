const path = require("path");
const fs = require("fs/promises");
const sharp = require("sharp");

const root = path.join(__dirname, "..");
const source = path.join(root, "icon.png");
const sizes = [16, 24, 32, 48, 64, 128, 256];

async function createWindowsIcon(images) {
  const headerSize = 6 + images.length * 16;
  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);

  let offset = headerSize;
  images.forEach(({ size, data }, index) => {
    const entry = 6 + index * 16;
    header.writeUInt8(size === 256 ? 0 : size, entry);
    header.writeUInt8(size === 256 ? 0 : size, entry + 1);
    header.writeUInt8(0, entry + 2);
    header.writeUInt8(0, entry + 3);
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(data.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += data.length;
  });

  await fs.writeFile(path.join(root, "build", "icon.ico"), Buffer.concat([
    header,
    ...images.map(({ data }) => data),
  ]));
}

async function generate() {
  await sharp(source).resize(512, 512).png().toFile(path.join(root, "build", "icon.png"));
  const images = await Promise.all(sizes.map(async (size) => ({
    size,
    data: await sharp(source).resize(size, size).png().toBuffer(),
  })));
  await createWindowsIcon(images);
  console.log("Generated build/icon.png and build/icon.ico from icon.png");
}

generate().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
