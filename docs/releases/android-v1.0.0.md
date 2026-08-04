# Work Day with God for Android 1.0.0

This is the first public Android release of Work Day with God: a completely free, Christ-centred devotional companion that works offline, requires no account, and keeps personal reading activity on the device.

Android 1.0.0 is published under the platform-specific tag `android-v1.0.0`. It is separate from the current Windows 1.4.3 release and does not replace Windows as the repository’s Latest release.

## Download

- `Work-Day-with-God-Android-1.0.0.apk` — signed APK for direct installation on Android 7.0 and newer
- `Work-Day-with-God-Android-1.0.0.apk.sha256` — SHA-256 checksum sidecar

SHA-256 for the APK: `C89BABA4652A553C2799F74F2C8335523DA54C868CD85725D792BB5836B16D84`

Signing-certificate SHA-256 fingerprint: `30:89:FB:CF:57:20:E9:A8:B1:F1:8C:1F:93:48:0A:DE:99:F8:29:D1:E5:94:DB:18:0F:B1:D4:04:79:07:03:59`

This APK is distributed directly through GitHub, not Google Play. Android may ask you to allow **Install unknown apps** for the browser or file manager used to open it. The APK is signed with Work Day with God’s dedicated private Android release key so future official APKs can update the same installation.

## Highlights

- Complete offline catalogue of 366 Christ-centred devotionals, including February 29
- Nine bundled historical Bible translations and full-chapter reading
- Responsive, touch-first Verse Card, devotional reader, Settings, History, and Future Devotionals screens
- Device-local favourites, completed readings, streaks, reading positions, appearance, and reminder preferences
- JSON backup export through Android’s share sheet and restore through Android’s file picker
- Automatic sunrise-to-sunset appearance using optional approximate location, with an offline local-time fallback
- Branded Android launcher icon, adaptive icon, splash screen, notification icon, status bar, safe-area layout, and system back-button behavior
- No account, subscription, advertising, analytics, cloud database, or background content download

## Android reminder system

- **Daily reading:** Scheduled at one or more selected local times and opens today’s full devotional.
- **Remind me later:** Requested from the Verse Card in 10-minute increments from 10 to 90 minutes and reopens the compact Verse Card.
- **Devotional timer:** Repeats from 1 to 120 whole minutes and reopens the compact Verse Card.
- Separate audible and silent Android notification channels for every reminder type
- Three independent Settings test buttons
- Active-weekday, quiet-hour, pause, disabled-notification, and empty-schedule safeguards
- Optional **Alarms & reminders** access for precise timing, with `allowWhileIdle` scheduling and automatic queue refresh

## Mobile interface work

- Rebuilt the desktop-shaped Settings panel as a vertically scrolling, phone-width screen with larger rows and controls.
- Resized calendar navigation, weekday labels, date cells, completion/favourite indicators, legends, and devotional list cards for narrow displays.
- Added touch-sized targets, bottom navigation, safe-area insets, mobile typography, and responsive reader spacing.
- Preserved smooth view transitions while respecting the existing Reduced motion preference.

## Privacy and permissions

- Personal state remains in private Android application storage unless the user explicitly exports a backup.
- Android cloud backup and cleartext network traffic are disabled.
- Notification permission is requested only for reminder functionality.
- Approximate location is optional and used locally only to determine sunrise and sunset for Auto appearance.
- **Alarms & reminders** access is optional; without it, Android may delay inexact notifications to conserve battery.
- The app does not request contacts, microphone, camera, phone, SMS, or account access.

## Verification completed

- Full automated Node test suite passed, including Android notification definitions, channel routing, scheduling limits, weekday handling, and quiet-hour boundaries.
- Vite production build and Capacitor Android synchronization passed.
- Signed Gradle release assembly passed.
- APK zip alignment and signing certificate verification passed.
- Physical-device testing completed on a Samsung SM-G781W running Android 13.
- All three notification types were delivered and opened the intended destination.
- Exact alarm permission and 128 exact future alarm entries were confirmed during device testing.
- Final app-specific Android log review found zero errors.
- The published APK and checksum sidecar were downloaded from GitHub after publication and compared byte-for-byte with the local release artifacts.

## Known Android behavior

- Direct GitHub installation requires sideloading permission and does not provide Google Play automatic updates.
- Android or manufacturer battery-management settings can still affect background delivery; precise timing access reduces broad delivery windows but cannot override every device policy.
- Android notification-channel settings can override the app’s sound choice after a channel has been customized in system Settings.
- Uninstalling the app removes private local data. Export a JSON backup before uninstalling if reading history or preferences should be retained.

For step-by-step installation, permission details, backups, build instructions, and troubleshooting, read the [Android guide](https://github.com/mcographics/WorkDaywithGod/blob/android-v1.0.0/docs/ANDROID.md). For support and feedback, join the [Work Day with God Discord server](https://discord.gg/2UvdpY4JSW).
