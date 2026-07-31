# Work Day with God

An offline-first Windows devotional companion that places Scripture, reflection, and prayer gently into the workday.

## First release

- 366 calendar entries, including February 29
- A unique locally bundled scenic background for every entry
- Original Work Day with God reflections, questions, and prayers
- Compact startup card and expanded devotional reader
- Native Windows notifications and background scheduling
- Four default weekday reminders at 9:00, 12:00, 15:00, and 17:00
- Specific-time or interval scheduling, editable weekdays, quiet hours, and snooze
- Closing always hides the app to its own system-tray icon
- Right-click tray menu with Open, Settings, and Quit
- Launch at Windows login
- Calendar history, completion tracking, streaks, and favourites
- Light/dark/system appearance, three themes, focus mode, reduced motion, and reading controls
- Full chapter reading in nine locally bundled historical/public-domain translations

## Development

Node.js 22.12 or newer is required.

```powershell
npm install
npm run content:generate
npm run branding:generate
npm run dev
```

Run verification:

```powershell
npm test
npm run build
npm audit
```

## First Windows installer

```powershell
npm run dist:win
```

The unsigned per-user NSIS installer is written to `release/`. It creates Start Menu identity and optionally a desktop shortcut while preserving user settings during uninstall.

This first testing build is intentionally unsigned. Windows SmartScreen may display an “Unknown publisher” warning. Production distribution should use a Windows code-signing certificate supplied through Electron Builder’s standard environment variables.

## Local application data

Settings and history are stored atomically under Electron’s Windows `userData` directory in `work-day-with-god.json`. A backup is maintained beside the active file, and malformed data is preserved with a `.corrupt-*` suffix before defaults are restored.

The source `data` directory is a multi-gigabyte study archive. The installer includes only:

- KJV
- American Standard Version
- Darby Bible Translation
- Douay-Rheims Bible
- English Revised Version
- JPS 1917
- Webster Bible Translation
- Young’s Literal Translation
- Geneva Bible 1560

Strong’s, BHSA/N1904, Vines, cross-references, source PDFs/DOCX files, health imagery, ambiguous translation caches, and unrelated user-state files are excluded.

## Deferred

Accounts, cloud synchronization, community submissions, social sharing, runtime AI content, automatic updating, and extensive Bible-study tooling are outside this release.
