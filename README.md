# Work Day with God

**A completely free daily devotional app for Christians.**

Work Day with God is a peaceful Windows desktop companion created to help Christians pause, read Scripture, reflect, and pray throughout the working day.

Each calendar day presents a Bible verse, an original devotional reflection, a practical question, a short prayer, and a scenic background. Gentle reminders can be scheduled around your day, while the app remains quietly available from the Windows system tray.

There are no subscriptions, advertisements, accounts, or paid features. The app is completely free to download and use.

## Application preview

| Daily Scripture card | Expanded devotional reader |
| --- | --- |
| ![Work Day with God daily Scripture card](https://raw.githubusercontent.com/mcographics/WorkDaywithGod/main/Adverts/ijTay.jpg) | ![Work Day with God expanded devotional reader](https://raw.githubusercontent.com/mcographics/WorkDaywithGod/main/Adverts/7fbJC.jpg) |
| **Reading history** | **Settings and reminders** |
| ![Work Day with God calendar and reading history](https://raw.githubusercontent.com/mcographics/WorkDaywithGod/main/Adverts/DnmHh.jpg) | ![Work Day with God reminder and startup settings](https://raw.githubusercontent.com/mcographics/WorkDaywithGod/main/Adverts/UV6ZZ.jpg) |

## What the app offers

- 366 daily devotionals, including a dedicated February 29 entry
- A unique scenic background for every day
- KJV anchor verses with original Work Day with God reflections
- Practical reflection questions and short daily prayers
- Compact devotional card and expanded reading view
- Full Bible chapter reading in nine bundled translations
- Custom reminder times or repeating reminder intervals
- Editable active weekdays, quiet hours, snooze, and pause controls
- Windows notifications that open the relevant devotional
- Calendar history, completed readings, favourites, and streak tracking
- Adjustable text size and reading controls
- Light and dark modes, colour themes, focus mode, and reduced motion
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

The application stores its local preferences and reading history in Electron’s Windows application-data directory. A backup is maintained so malformed state can be recovered safely.

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

Download the latest `Work-Day-with-God-Setup` executable from the project’s Releases page and run it.

The current public build is an unsigned, per-user Windows installer. Windows SmartScreen may show an **Unknown publisher** warning. Review the downloaded file and choose **More info** followed by **Run anyway** if you trust the release.

The installer creates a Start Menu shortcut and offers a desktop shortcut. Uninstalling the application preserves personal settings unless those files are removed manually.

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

The installer is written to the local `release` directory.

## Content and artwork

The reflections, questions, and prayers are original Work Day with God content. Daily scenic artwork is bundled locally and optimized for offline use. Scripture and artwork details are documented in [CONTENT_AND_ASSET_PROVENANCE.md](CONTENT_AND_ASSET_PROVENANCE.md).

## Current release scope

Work Day with God is intentionally focused on personal daily devotion. It does not include accounts, cloud synchronization, social sharing, community submissions, runtime AI content, advertising, or extensive Bible-study datasets.

---

May Work Day with God help bring Scripture, prayer, and a moment of peace into every working day.
