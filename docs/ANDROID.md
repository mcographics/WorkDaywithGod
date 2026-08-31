# Work Day with God for Android

Work Day with God for Android is a free, Christ-centred, offline-first devotional companion. Android 1.0.3 is maintained as a separate release line from Work Day with God 1.4.9 for Windows.

## Supported devices

- Android 7.0 or newer (`minSdk 24`)
- Phones and phone-sized Android devices
- ARM and x86 Android architectures supported by the Android WebView and Capacitor runtime
- No Google account, Work Day with God account, subscription, or constant internet connection required

The application targets Android API 36. It uses Android’s installed System WebView to render the interface and native Capacitor bridges only for device features such as notifications, private preferences, sharing, file selection, coarse location, status-bar styling, and the system back button.

## Install from GitHub

1. Open the [Android 1.0.3 GitHub release](https://github.com/mcographics/WorkDaywithGod/releases/tag/android-v1.0.3).
2. Download `Work-Day-with-God-Android-1.0.3.apk` and `Work-Day-with-God-Android-1.0.3.apk.sha256`.
3. Optionally verify the download in PowerShell:

   ```powershell
   Get-FileHash .\Work-Day-with-God-Android-1.0.3.apk -Algorithm SHA256
   ```

   Compare the result with the first value in the downloaded `.sha256` file and the checksum printed in the GitHub release notes.
4. Open the APK on the Android phone. If prompted, allow **Install unknown apps** for the browser or file manager that opened it.
5. Complete the Android installation, open Work Day with God, and grant notification access if reminders are wanted.
6. The temporary **Install unknown apps** permission may be disabled again after installation.

The APK is signed with a dedicated Work Day with God Android release key. Its signing-certificate SHA-256 fingerprint is `30:89:FB:CF:57:20:E9:A8:B1:F1:8C:1F:93:48:0A:DE:99:F8:29:D1:E5:94:DB:18:0F:B1:D4:04:79:07:03:59`. A future APK can update this installation only when it uses the same application ID and signing identity. Protect the release keystore and signing properties: losing them would prevent seamless updates to existing installations.

## Notification and reminder types

Android 1.0.3 has three application-specific reminder paths plus a separate app-update notification:

| Reminder | Created by | Notification text | Opens |
| --- | --- | --- | --- |
| Daily reading | One or more local times in **Settings → Schedule style → Daily reading** | **Today’s devotional is ready** | Today’s full devotional |
| Remind me later | Clock action on the compact Verse Card | **Your quiet moment is ready** | Compact Verse Card |
| Devotional timer | Whole-minute interval in **Settings → Schedule style → Devotional timer** | **Devotional timer** | Compact Verse Card |
| App update | A new Android release is found on GitHub | **Work Day with God update available** | Android Updates settings |

Each type has a distinct Android notification channel plus a silent version. The app’s **Notification sound** switch chooses the audible or silent channel when it schedules reminders. Android’s own per-channel notification settings take precedence if the user customizes them in system Settings.

Schedules obey the selected active weekdays, optional quiet hours, notification master switch, and temporary pause state. Clearing every active weekday cancels managed scheduled reminders and disables the Verse Card’s Remind me later action until a day is selected again. The app keeps up to 128 upcoming managed notifications in Android’s pending queue and refreshes that queue after relevant settings or app lifecycle changes.

## Android permissions

- **Notifications:** Required on Android 13 and newer to display reminders. The app asks only when notifications are enabled or tested.
- **Alarms & reminders:** Optional special access used for more precise delivery. Without it, Android may widen or delay reminder delivery to conserve battery. Use **Settings → Notifications and reminders → Precise reminder timing** in the app to open the correct Android system page.
- **Approximate location:** Optional and used only on the device to calculate local sunrise and sunset for **Auto** colour mode. If permission is declined or location is unavailable, the app uses its offline local-time fallback.
- **Internet:** Used only for opening Discord/support pages or checking/downloading an Android release from the fixed Work Day with God GitHub repository. The devotional catalogue, Scripture, scenic artwork, settings, history, and reminders are installed locally.

Android cloud backup is disabled for the application. Work Day with God does not request contacts, microphone, camera, phone, SMS, or account permissions.

## Local data and backups

Settings, favourites, completed readings, streak state, reading positions, and reminder preferences are stored in the application’s private Android storage. No Work Day with God server receives this information.

Use **Settings → Data and privacy → Export backup** to create a JSON backup and send it to a location chosen in Android’s share sheet. Use **Import backup** to restore a compatible JSON file through Android’s file picker. Exported backups contain personal reading state, so store or share them only where intended.

Installing a newer correctly signed APK over the existing app preserves private data. Uninstalling the Android app removes its private local state, so export a backup first if that information matters.

## Touch interface

The Android layout is not the Windows executable inside a container. It is a Capacitor Android application with a responsive React interface and native Android integrations. The phone layout provides:

- touch-sized Verse Card, reader, Settings, and calendar controls;
- bottom navigation and Android system-back behavior;
- full-width scrolling Settings rather than a desktop side panel;
- responsive History and Future Devotionals calendars;
- safe-area handling for status bars, navigation areas, and display cutouts;
- mobile-specific reader sizing while keeping the same devotional and Scripture content as Windows.
- Phone UI size adjustment from 85% to 140% for devices using enlarged Android display or font settings; the app uses fluid widths, wrapping controls, and scrollable Settings so enlarged content remains usable.

## Android updates

Open **Settings → Android updates**:

- **Update** checks the public Android release line on GitHub and reports the installed and available versions.
- **Install** downloads the exact official APK, reports progress, and opens Android’s package installer. Approve the Android install prompt to complete the update.
- **View on GitHub** opens the matching Android release page.

The app sends an update-available notification once for each newly discovered Android release when notifications are enabled. Installing a newer APK over the current signed installation preserves local settings, favourites, history, reading positions, and reminders. Android may require **Install unknown apps** permission for Work Day with God before the in-app installer can proceed.

## Build Android locally

Prerequisites:

- Node.js 22 or newer
- Android Studio with Android SDK Platform 36 and Build-Tools 36.0.0
- JDK 17 through 24; the Windows helper recognizes the standard local Temurin 21 installation

Commands:

```powershell
npm install
npm test
npm run android:sync
npm run android:debug
```

The debug command writes `release/android/Work-Day-with-God-Android-Debug-1.0.3.apk` plus a `.sha256` file. Debug builds use the standard Android development key and must not be published as production releases.

## Build a signed release

The Gradle release configuration reads signing material from the path in `WORKDAYWITHGOD_ANDROID_SIGNING_PROPERTIES`, or from this default Windows location:

```text
%USERPROFILE%\.android\workdaywithgod-release-signing.properties
```

The untracked Java properties file must define:

```properties
storeFile=C:/secure/path/workdaywithgod-release.jks
storePassword=REDACTED
keyAlias=workdaywithgod-android-release
keyPassword=REDACTED
```

Never commit the properties file, keystore, or passwords. Keep encrypted offline backups of both the keystore and its credentials.

Build the signed APK:

```powershell
npm run android:release
```

The release helper performs the Vite production build, synchronizes Capacitor, runs Gradle `assembleRelease`, copies the APK into `release/android`, verifies zip alignment, verifies the APK signing certificate, and writes a SHA-256 sidecar. Successful output is:

```text
release/android/Work-Day-with-God-Android-1.0.3.apk
release/android/Work-Day-with-God-Android-1.0.3.apk.sha256
```

Android’s visible semantic version and monotonically increasing build code live in `android/gradle.properties`. Windows continues to use the repository-level `package.json` version. For Android 1.0.3, the version name is `1.0.3` and version code is `100003`; future Android releases must always increase the version code.

## Troubleshooting

- **No reminder appears:** Confirm the notification master switch is enabled, at least one active weekday is selected, the current time is outside quiet hours, and Android notification permission is allowed.
- **A reminder arrives late:** Enable **Precise reminder timing** and check whether Android battery optimization or vendor-specific sleeping-app controls are restricting Work Day with God.
- **Notification sound is different:** Open Android’s notification settings for Work Day with God. System channel settings override the app’s original channel defaults.
- **An update will not install:** Confirm the new APK is an official Work Day with God Android release with the same package ID and signing identity. A debug build cannot update a production-signed installation.
- **State would be lost before uninstalling:** Export a JSON backup first, then import it after reinstalling.

For support, feedback, or bug reports, use the [Work Day with God Discord server](https://discord.gg/2UvdpY4JSW).
