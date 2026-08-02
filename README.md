# Work Day with God

**A completely free daily devotional app for Christians.**

Work Day with God is a peaceful Windows desktop companion created to help Christians pause, read Scripture, reflect, and pray throughout the working day.

**[Download the latest release](https://github.com/mcographics/WorkDaywithGod/releases/latest)** · **[Discord support](https://discord.gg/2UvdpY4JSW)** · **[Changelog](CHANGELOG.md)** · **[Security policy](SECURITY.md)**

Each calendar day presents a Bible verse, an original devotional reflection, a practical question, a short prayer, and a scenic background. Gentle reminders can be scheduled around your day, while the app remains quietly available from the Windows system tray.

There are no subscriptions, advertisements, accounts, or paid features. The app is completely free to download and use.

## Application preview

| Daily Scripture card | Expanded devotional reader |
| --- | --- |
| ![Work Day with God daily Scripture card](https://raw.githubusercontent.com/mcographics/WorkDaywithGod/main/screenshots/ijTay.jpg) | ![Work Day with God expanded devotional reader](https://raw.githubusercontent.com/mcographics/WorkDaywithGod/main/screenshots/7fbJC.jpg) |
| **Reading history** | **Settings and reminders** |
| ![Work Day with God calendar and reading history](https://raw.githubusercontent.com/mcographics/WorkDaywithGod/main/screenshots/DnmHh.jpg) | ![Work Day with God reminder and startup settings](https://raw.githubusercontent.com/mcographics/WorkDaywithGod/main/screenshots/UV6ZZ.jpg) |

## What the app offers

- 366 explicitly Christ-centred daily devotionals.
- A unique scenic background for every day
- Encouraging KJV anchor verses, with roughly three quarters drawn from the New Testament and hope-filled pastoral selections from the Old Testament
- Original reflections, practical questions, closing thoughts, and prayers that point readers to Jesus or Christ
- Compact devotional card and expanded reading view
- Full Bible chapter reading in nine bundled translations
- Custom reminder times or repeating reminder intervals
- Editable active weekdays, quiet hours, snooze, and pause controls
- Windows notifications that open the relevant devotional
- Calendar history, completed readings, favourites, and streak tracking
- Adjustable text size and reading controls
- Automatic sunrise-to-sunset, system, light, and dark modes; colour themes; focus mode; and reduced motion
- Optional launch when signing in to Windows
- System-tray operation with **Open**, **Settings**, and **Quit**
- Automatic daily rollover at midnight
- Complete offline operation after installation

## Designed for a quieter workday

Work Day with God is intended to provide small moments of spiritual stillness without becoming another demanding application. It can open with today’s devotional, remind you at suitable times, and then stay out of the way in the system tray.

Closing the window does not stop the app. It hides the window in the system tray so scheduled reminders can continue. To close it completely, right-click the tray icon and select **Quit**.

## Free, private, and offline

Work Day with God is completely free for Christians to use.

- No account is required.
- No subscription is required.
- No advertisements are displayed.
- No internet connection is required after installation.
- No personal reading information is sent to a server.
- Settings, favourites, history, streaks, and reminder state remain on your computer.

The application stores its local preferences and reading history in Electron’s platform-specific application-data directory. A backup is maintained so malformed state can be recovered safely.

## Support and feedback

For application support, feedback, or bug reports, join the official [Work Day with God Discord server](https://discord.gg/2UvdpY4JSW).

Discord is optional and is not required to use Work Day with God. The application remains completely offline after installation, requires no account or subscription, and does not send reading activity to Discord or another remote service.

## Copyright, free use, and licensing

**Work Day with God is provided completely free of charge.** There is no purchase price, subscription fee, advertising charge, or required donation. Everyone may download, install, and use the official application without payment.

Copyright © 2026 Kenneth Salmon / Work Day with God. All rights reserved unless a separate licence or attribution notice explicitly states otherwise.

“Free of charge” describes the cost of using the application; it does not place the project in the public domain or transfer ownership of its source code, devotional writing, branding, interface design, or original artwork. The project and its original materials may not be sold, repackaged, redistributed, modified for redistribution, or presented as another person’s work without prior written permission from the copyright owner.

Bundled Bible translations, open-source software libraries, scenic source materials, and other third-party components remain subject to their respective copyright, public-domain, and licence terms. Further details are available in [Content and Asset Provenance](CONTENT_AND_ASSET_PROVENANCE.md).

The application is provided “as is,” without warranties or guarantees. For permissions or copyright questions, contact [kenneth.salmon87@outlook.com](mailto:kenneth.salmon87@outlook.com).

## Bible translations

The daily devotional quotation remains in the King James Version. The full-chapter reader allows the user to choose from these locally bundled historical translations:

- King James Version
- American Standard Version
- Darby Bible Translation
- Douay-Rheims Bible
- English Revised Version
- JPS 1917
- Webster Bible Translation
- Young’s Literal Translation
- Geneva Bible 1560

## Installing on Windows

The current stable release is **Work Day with God 1.4.1 for Windows x64**. Download `Work-Day-with-God-Setup-1.4.1.exe` from the [latest GitHub release](https://github.com/mcographics/WorkDaywithGod/releases/latest) and run it.

The current public build is an unsigned, per-user Windows installer. Windows SmartScreen may show an **Unknown publisher** warning. Review the downloaded file and choose **More info** followed by **Run anyway** if you trust the release.

The installer creates a Start Menu shortcut and offers a desktop shortcut. Uninstalling the application preserves personal settings unless those files are removed manually.

## Linux status

Experimental Linux packages from the earlier 1.2.2 testing preview remain available for evaluation, but Linux packages are not included with the latest stable release and Linux support should currently be considered preliminary.

The experimental Linux packages use three formats:

- **AppImage** for a portable application that runs across many distributions without installation. Make it executable with `chmod +x` before launching it.
- **DEB** for Debian, Ubuntu, Linux Mint, and other Debian-based distributions.
- **RPM** for Fedora, RHEL, openSUSE, and other RPM-based distributions.

The experimental Linux packages are unsigned. Distribution security policies may display a warning or require the user to confirm installation.

## For developers

Node.js 22.12 or newer is recommended.

```powershell
npm install
npm run content:generate
npm run branding:generate
npm run dev
```

Run the automated checks and production web build:

```powershell
npm test
npm run build
npm audit
```

Create the Windows installer:

```powershell
npm run dist:win
```

For experimental testing, Windows developers can create Linux x64 AppImage, DEB, and RPM packages through Docker Desktop’s Linux engine:

```powershell
npm run dist:linux:docker
```

Docker Desktop must be running. The build uses the date-pinned `electronuserland/builder:22-05.26` image and stores reusable dependency caches in Docker volumes. Windows and Linux packages are written to the local `release` directory.

## Content and artwork

The reflections, questions, and prayers are original Work Day with God content. Daily scenic artwork is bundled locally and optimized for offline use. Scripture and artwork details are documented in [CONTENT_AND_ASSET_PROVENANCE.md](CONTENT_AND_ASSET_PROVENANCE.md).

## Current release scope

Work Day with God is intentionally focused on personal daily devotion. It does not include accounts, cloud synchronization, social sharing, community submissions, runtime AI content, advertising, or extensive Bible-study datasets.

---

May Work Day with God help bring Scripture, prayer, and a moment of peace into every working day.
