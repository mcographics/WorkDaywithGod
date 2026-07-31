# Changelog

All notable changes to Work Day with God are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/mcographics/WorkDaywithGod/compare/v1.1.1...HEAD
[1.1.1]: https://github.com/mcographics/WorkDaywithGod/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/mcographics/WorkDaywithGod/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/mcographics/WorkDaywithGod/releases/tag/v1.0.0
