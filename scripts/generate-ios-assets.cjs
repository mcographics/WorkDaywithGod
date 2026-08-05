const path = require("node:path");
const sharp = require("sharp");

const projectRoot = path.resolve(__dirname, "..");
const sourceIcon = path.join(projectRoot, "assets", "logo.png");
const iconOutput = path.join(projectRoot, "ios", "App", "App", "Assets.xcassets", "AppIcon.appiconset", "AppIcon-512@2x.png");
const splashDirectory = path.join(projectRoot, "ios", "App", "App", "Assets.xcassets", "Splash.imageset");
const background = { r: 22, g: 26, b: 21, alpha: 1 };

async function generate() {
  const splashLogo = await sharp(sourceIcon)
    .resize(1120, 1120, { fit: "contain" })
    .flatten({ background })
    .png()
    .toBuffer();

  await sharp(sourceIcon)
    .resize(1024, 1024, { fit: "cover" })
    .flatten({ background })
    .png()
    .toFile(iconOutput);

  for (const filename of ["splash-2732x2732.png", "splash-2732x2732-1.png", "splash-2732x2732-2.png"]) {
    await sharp({ create: { width: 2732, height: 2732, channels: 3, background } })
      .composite([{ input: splashLogo, gravity: "centre" }])
      .flatten({ background })
      .removeAlpha()
      .png()
      .toFile(path.join(splashDirectory, filename));
  }

  console.log("Generated branded iOS app icon and launch-screen assets.");
}

generate().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
