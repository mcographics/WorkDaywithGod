# Changelog

All notable changes to Work Day with God are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.4.3] - 2026-08-02

### Fixed

- Isolated development Electron windows from the packaged Windows AppUserModelID and assigned a fresh stable production identity so running the development server cannot replace the installed app's taskbar icon with Electron's atom.

## [1.4.2] - 2026-08-02

### Added

- Added automatic GitHub release checks with device-local Daily, Weekly, Monthly, and Never frequency preferences.
- Added a Settings update status panel with manual checking and a safe link to an available release.

## [1.4.1a] - 2026-08-02

### Fixed

- Added a fresh, stable Windows shell identity, a standalone taskbar `.ico`, and complete relaunch metadata reapplied after the native window is shown so the running taskbar group keeps the **Work Day with God** name and icon instead of Electron’s default atom identity.

## [1.4.1] - 2026-08-02

### Fixed

- Replaced Electron’s default atom icon on the Windows taskbar by binding the live window to the packaged executable’s Work Day with God icon resource, using the multi-resolution `.ico` at runtime, and adding native 20 px and 40 px high-DPI taskbar sizes.

## [1.4.0] - 2026-08-02

### Added

- Added an **Auto** colour mode that uses the device’s location to keep the reader light from local sunrise to sunset and dark overnight.
- Added an offline local-time fallback for Auto colour mode when location is unavailable or permission is declined.
- Added an in-app schedule warning when every active reminder day has been cleared.

### Changed

- Replaced the repeating reminder interval number field with a dropdown containing every whole minute from 1 through 120.
- Replaced the Verse Card’s **Remind me later** number field with a dropdown containing 10-minute increments from 10 through 90 minutes.
- Reworked navigation between reader tabs and between the reader and compact Verse Card with staged fade-dissolve transitions.
- Limited Electron’s renderer permission handling to geolocation requested by the trusted application window for Auto colour mode; all other renderer permissions remain denied.
- Preserved immediate navigation for users who enable **Reduced motion**.

### Fixed

- Disabled the Verse Card clock button when no schedule days are selected and added a tooltip directing the user to **Schedule style** in Settings.
- Prevented renderer or IPC calls from starting **Remind me later** while notifications are disabled or no schedule day is active.
- Cancelled pending one-off reminders and snooze state when the final active schedule day is cleared.
- Updated the scheduler so a stored timer cannot fire while the schedule has no active days.
- Isolated development user data and Chromium caches from the installed application so `npm run dev` no longer collides with a running installed copy.
- Staged the Verse Card/reader resize between a complete fade-out and fade-in so the native window resize no longer causes an abrupt screen swap.
- Replaced full-window tab snapshots with a clipped content-layer dissolve, keeping the header and rounded window frame continuously rendered and removing four-corner and blank-frame artifacts.

## [1.3.0] - 2026-08-02

### Changed

- Rebuilt all 366 daily devotionals around an explicitly Christ-centred, encouraging pastoral content policy.
- Limited Old Testament Verse Card anchors to hope-filled pastoral passages and made roughly three quarters of all daily anchors New Testament passages.
- Replaced the support email shown in Settings with the official Work Day with God Discord support server.

### Fixed

- Prevented isolated verses about judgment, violence, condemnation, distress, and other context-dependent themes from being selected as daily encouragement.
- Added automated content-policy checks so future catalogue rebuilds cannot silently reintroduce unsuitable Verse Card anchors or generic reflections that do not name Jesus or Christ.
- Isolated the development server on a dedicated strict port so another local Vite application cannot appear inside the Verse Card window.

## [1.2.2] - 2026-08-02

### Added

- Added Linux x64 packaging for AppImage, DEB, and RPM distributions.
- Added a repeatable Docker-based Linux build command for Windows development machines.

### Fixed

- Made the **Verse card** action return directly to the compact Verse Card after opening a devotional from either History or Future Devotionals.
- Kept History strictly on past dates and made it open on the latest available past month.
- Included today in Future Devotionals so today’s completed-reading indicator appears in its calendar.
- Applied completed-reading changes immediately and protected newer reading state from stale persistence responses.

## [1.2.1] - 2026-07-31

### Security

- Reviewed the packaged application paths for command execution, hidden downloads, remote runtime code, credential access, cryptocurrency mining, and untrusted navigation; none are present.
- Restricted every renderer-to-main IPC command to the application’s trusted main window and main frame.
- Explicitly enabled Electron web security and disabled insecure content, webviews, production developer tools, and drag-and-drop navigation.
- Limited imported backup files to 5 MB and sanitized favourite IDs, history dates, timestamps, and reading positions before persistence.
- Added automated regression checks for Electron isolation, sandboxing, navigation restrictions, permission denial, IPC sender validation, Content Security Policy, and the packaged-file allowlist.

### Fixed

- Rejected malformed or unsafe values in imported favourites, completion history, and saved reading positions.

## [1.2.0] - 2026-07-31

### Added

- An expanded **About** section inside Settings describing the application and its free, offline-first purpose.
- Author and developer attribution for Kenneth Salmon.
- A clickable support address for `kenneth.salmon87@outlook.com` that opens the user’s default email application.
- Application version and Windows notification-support information in Settings.
- A public README section explaining that the official app is completely free of charge while original content and branding remain protected by copyright.
- Promotional application artwork and transparent B-roll cutouts for public release materials.

### Changed

- Kept About information within the Settings page instead of adding another primary navigation tab.

## [1.1.1] - 2026-07-31

### Fixed

- Assigned the publisher-specific Windows application identity `com.mcographics.workdaywithgod`, preventing the installed application from being grouped with Electron development windows on the taskbar.
- Set the Windows application name explicitly to **Work Day with God** so taskbar and notification identity remain consistent.
- Made the root `icon.png` the direct runtime icon source for the Electron window, taskbar, and system tray.
- Kept `icon.png` as the single branding source by generating the Windows executable and NSIS installer `.ico` resource from it during every release build.
- Rebuilt the Windows installer with the corrected application identity and icon configuration.

## [1.1.0] - 2026-07-31

### Added

- A live centre-header display showing the user’s local time and date alongside Jerusalem time and the Hebrew calendar date.
- Ten selectable accent colours: gold, blue, forest, burgundy, lavender, terracotta, sage, rose, teal, and charcoal.
- Accent-coloured edge illumination around the Verse Card and expanded reader.
- A Future Devotionals calendar that can be hidden from Settings.
- Calendar-based reading history with completed and favourite indicators.
- Independent text-size controls for devotional reflections and full Bible chapters.
- Descriptions and tooltips for application buttons, controls, and settings.
- A Settings button that returns directly to the compact Verse Card.
- A persistent one-time “Remind me later” notification with visible confirmation.
- Automated checks for every month-ending date, all 366 scenes, reminder schedules, imported settings, and translation references.
- A repeatable scene-library build process that creates the complete daily WebP collection from local source photographs.

### Changed

- Replaced the original subdued scenic collection with 366 distinct, brighter 1920×1080 backgrounds sourced from the bundled landscape library.
- Added a compact semi-transparent header across the Verse Card for improved branding, clock, and window-control visibility.
- Improved Verse Card positioning and responsive typography for longer Scripture passages.
- Reduced the reflection button size and made it translucent over scenic backgrounds.
- Updated dark mode to use black and neutral muted-grey surfaces without a green cast.
- Applied theme accents consistently to Scripture references, verse numbers, selected verses, headings, links, toggles, and controls.
- Brightened dark-mode accent colours to maintain accessible contrast.
- Added visible text labels to the expanded reader’s right-side controls.
- Renamed the reading command to **Restart Auto-Scroll**.
- History now includes today and permits every valid 30th and 31st calendar date.
- Kept the Today tab fixed to the current local date while preserving separate past and future browsing.
- Moved source JPG folders outside the production public directory, reducing the production build from approximately 322 MB to 119 MB.

### Fixed

- Fixed a white screen that could appear when opening **Read today’s reflection**.
- Fixed the default Electron icon appearing on the Windows taskbar.
- Fixed the compact Verse Card retaining the expanded reader’s minimum window width.
- Fixed History navigation preventing movement from the previous day to today.
- Fixed silent Verse Card reminder actions by adding a real persisted notification and confirmation message.
- Fixed notification controls appearing usable while notifications were disabled.
- Fixed repeated state initialization and listener registration when changing application modes.
- Fixed malformed imported settings being able to leave invalid themes, translations, booleans, or quiet-hour values in application state.
- Fixed startup failures leaving the application indefinitely on its loading screen.
- Added explicit denial of unrequested Electron permission requests.
- Prevented source scene JPGs and temporary processing files from entering the public build or repository upload.

### Security

- Confirmed Electron context isolation, renderer sandboxing, disabled Node integration, blocked navigation, restricted window creation, and a limited preload API.
- Added explicit Electron permission request and permission check handlers that deny unrequested access.
- Confirmed zero known dependency vulnerabilities with `npm audit`.

## [1.0.0] - 2026-07-30

### Added

- The first public Windows release of Work Day with God.
- 366 original daily devotionals, including a dedicated February 29 entry.
- KJV anchor verses, original reflections, practical questions, and short prayers.
- A compact daily Scripture card and expanded devotional reader.
- A unique offline scenic background for every calendar day.
- Automatic local-date selection and midnight rollover.
- Full-chapter reading using nine bundled historical Bible translations:
  - King James Version
  - American Standard Version
  - Darby Bible Translation
  - Douay-Rheims Bible
  - English Revised Version
  - JPS 1917
  - Webster Bible Translation
  - Young’s Literal Translation
  - Geneva Bible 1560
- Specific-time and repeating-interval reminders.
- Active weekday selection, quiet hours, snooze, and pause controls.
- Windows notifications with devotional click-through.
- Favourites, completed readings, streak tracking, and saved reading positions.
- Light and dark appearances, colour themes, image-free focus mode, reduced motion, and auto-scroll.
- Launch-at-login support and optional silent tray startup.
- System-tray operation with Open, Settings, and Quit actions.
- Versioned local JSON persistence with atomic writes, recovery, export, import, and reset controls.
- An unsigned per-user NSIS installer with Start Menu and optional desktop shortcuts.
- Public README screenshots, content provenance documentation, and a vulnerability-reporting policy.

[Unreleased]: https://github.com/mcographics/WorkDaywithGod/compare/v1.4.3...HEAD
[1.4.3]: https://github.com/mcographics/WorkDaywithGod/compare/v1.4.2...v1.4.3
[1.4.2]: https://github.com/mcographics/WorkDaywithGod/compare/v1.4.1a...v1.4.2
[1.4.1a]: https://github.com/mcographics/WorkDaywithGod/compare/v1.4.1...v1.4.1a
[1.4.1]: https://github.com/mcographics/WorkDaywithGod/compare/v1.4.0...v1.4.1
[1.4.0]: https://github.com/mcographics/WorkDaywithGod/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/mcographics/WorkDaywithGod/compare/v1.2.2...v1.3.0
[1.2.2]: https://github.com/mcographics/WorkDaywithGod/compare/v1.2.1...v1.2.2
[1.2.1]: https://github.com/mcographics/WorkDaywithGod/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/mcographics/WorkDaywithGod/compare/v1.1.1...v1.2.0
[1.1.1]: https://github.com/mcographics/WorkDaywithGod/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/mcographics/WorkDaywithGod/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/mcographics/WorkDaywithGod/releases/tag/v1.0.0
