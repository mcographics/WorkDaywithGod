# Work Day with God for Android 1.0.1

Android 1.0.1 is a focused reading-interface update for Work Day with God. It remains completely free, Christ-centred, offline-first, account-free, and device-local.

This Android release is published under the platform-specific tag `android-v1.0.1`. It is separate from Windows 1.4.3 and does not replace Windows as the repository's Latest release.

## Download

- `Work-Day-with-God-Android-1.0.1.apk` — signed APK for Android 7.0 and newer
- `Work-Day-with-God-Android-1.0.1.apk.sha256` — SHA-256 checksum sidecar

The APK uses the same dedicated Work Day with God Android signing identity as Android 1.0.0, allowing it to update the existing installation while preserving device-local settings, favourites, completion history, and reading positions.

## Reading-interface enhancements

- The devotional header now uses a compact title area and menu so the reflection receives substantially more of the screen.
- Completion, favourite, full-chapter, text-size, auto-scroll, restart, adjacent-reading, Verse Card, and reading-settings controls are consolidated inside the devotional menu.
- Today, Future, and History remain in the main navigation instead of being duplicated in the menu.
- Devotional reading mode hides navigation and surrounding controls so the reflection can use the full phone screen.
- The Verse Card clock is larger, centered within the right side of the header, and positioned for a more balanced layout.
- The Work Day with God wordmark is larger and clearer on Android phones.
- Reader spacing, touch targets, safe-area behavior, typography, and menu contrast were refined for phone-sized displays.

## Privacy and compatibility

- No account, subscription, advertising, analytics, cloud database, or background content download was added.
- Existing Android 1.0.0 installations can be updated directly with the signed 1.0.1 APK.
- Personal reading activity remains in private application storage unless the user explicitly exports a backup.
- Uninstalling still removes private local state; install this update over the current app to preserve it.

## Verification

- All 42 automated tests passed.
- Vite production compilation and Capacitor Android synchronization passed.
- Signed Gradle release assembly passed.
- APK zip alignment and signing-certificate verification passed.
- The layout was installed and visually checked on a physical Samsung SM-G781W running Android 13.
- The published APK and checksum are redownloaded and hash-compared after publication as the final release gate.

For installation, permissions, reminders, backup, and troubleshooting, see the [Android guide](https://github.com/mcographics/WorkDaywithGod/blob/android-v1.0.1/docs/ANDROID.md). For support and feedback, join the [Work Day with God Discord server](https://discord.gg/2UvdpY4JSW).
