# Work Day with God for Android 1.0.4

Android 1.0.4 is a focused Android bug-fix release for Work Day with God. It remains free, Christ-centred, offline-first, account-free, and device-local. The Android release line is separate from Windows 1.4.9.

This release is published under the platform-specific tag `android-v1.0.4`.

## Download

- `Work-Day-with-God-Android-1.0.4.apk` — signed APK for Android 7.0 and newer
- `Work-Day-with-God-Android-1.0.4.apk.sha256` — SHA-256 checksum sidecar

SHA-256 for the APK: `E9F06F7EE61FD45B64AC022006A99CFC3C74D506513AB87CF6596A4ECF91DD0A`

Signing-certificate SHA-256 fingerprint: `30:89:FB:CF:57:20:E9:A8:B1:F1:8C:1F:93:48:0A:DE:99:F8:29:D1:E5:94:DB:18:0F:B1:D4:04:79:07:03:59`

The APK uses the established Work Day with God Android release signing identity, allowing it to update the existing Android installation while preserving device-local settings, favourites, completion history, reading positions, and reminders.

## Fix included

- Fixed the Verse Card A− and A+ controls on Android phones.
- Short, long, and extra-long quotations now all respect the selected Verse Card text size.
- The fix preserves the existing lower and upper bounds of 65% and 140%.

## Verification

- All automated tests passed.
- Vite production build, Capacitor Android synchronization, and signed Gradle release assembly passed.
- APK zip alignment and signing-certificate verification passed.
- The signed build installed over the existing Android installation and launched on a connected Samsung SM-G781W without uninstalling the app or removing its local data.

For installation, permissions, reminders, backup, build instructions, and troubleshooting, see the [Android guide](https://github.com/mcographics/WorkDaywithGod/blob/android-v1.0.4/docs/ANDROID.md). For support and feedback, join the [Work Day with God Discord server](https://discord.gg/2UvdpY4JSW).
