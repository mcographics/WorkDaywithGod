# Work Day with God for iOS

Work Day with God for iOS is a native Capacitor application that shares the React devotional experience with Android while using Apple platform services for notifications, private preferences, location, files, sharing, browser links, and the status bar. It is not the Windows executable running inside a compatibility container.

The checked-in iOS project is configured as version 1.0.0 with build number 1, bundle identifier `com.mcographics.workdaywithgod`, a minimum deployment target of iOS 15, and support for iPhone and iPad. It is a development target until a signed archive has been built and tested on macOS.

## What works on iOS

- the complete offline 366-day Christ-centred devotional catalogue;
- all nine bundled Scripture translations;
- the compact Verse Card, devotional reader, History, Future Devotionals, Settings, and Scripture drawer;
- native safe-area layout for the status bar, home indicator, and display cutouts;
- device-private settings, favourites, history, streaks, and reading positions;
- JSON backup export through the iOS share sheet and import through the system file picker;
- optional on-device location access for local sunrise and sunset in Auto appearance;
- Discord support links in Apple’s secure browser view; and
- native local notifications for Daily reading, Remind me later, and Devotional timer reminders.

The app does not require an account, subscription, cloud database, advertising identifier, contact access, camera, microphone, or remote devotional service.

## Notification behavior

iOS asks for notification permission when reminders are first enabled or tested. Each Work Day with God reminder retains its distinct title, message, destination, active weekdays, quiet-hour rules, and optional sound setting. Tapping a Daily reading notification opens today’s devotional; Remind me later and Devotional timer notifications return to the compact Verse Card.

iOS does not use Android notification channels or Android’s Alarms & reminders permission. The native scheduling queue is capped at 64 pending Work Day with God notifications and is refreshed after settings changes and when the app becomes active. iOS ultimately controls delivery presentation, Focus behavior, notification summaries, and whether sounds are permitted.

## Privacy permission

The iOS project includes this location purpose statement:

> Work Day with God uses your approximate location only on this device to calculate local sunrise and sunset for Auto appearance.

Location is optional. If access is declined, Auto appearance continues with its offline local-time fallback. Location is not uploaded to Work Day with God or retained in an account.

## Synchronize the native project

Install Node.js 22 or newer, restore packages, run the automated checks, and synchronize shared assets and plugins:

```bash
npm install
npm test
npm run ios:sync
```

The sync command builds the Vite application, regenerates the branded App Store icon and launch images, copies web assets, and updates all Capacitor Swift Package Manager dependencies.

## Open and run with Xcode

The actual iOS compilation toolchain is available only on macOS. Install Xcode 26 or newer, accept its licence, install the requested iOS simulator runtime, and then run:

```bash
npm run ios:open
```

In Xcode:

1. Select the **App** target.
2. Open **Signing & Capabilities**.
3. Select the Apple Developer team that will own the application.
4. Confirm the bundle identifier is available to that team. If Apple reports that `com.mcographics.workdaywithgod` is unavailable, choose a unique identifier before any public release and preserve it for all future updates.
5. Choose an iPhone simulator and run the application.
6. Choose a physically connected iPhone, trust the development certificate if prompted, and run again.
7. Test notification denial and approval, all three notification types, sound off and on, foreground and background delivery, reminder navigation, location denial and approval, backups, calendar touch targets, safe areas, rotation, dark mode, light mode, and reduced motion.

Local notifications must be validated on a physical iPhone before release; simulator behavior alone is not sufficient release evidence.

## Create a signed archive

An Apple Developer Program membership and the appropriate App Store Connect role are required for TestFlight or App Store distribution.

1. Increase `CURRENT_PROJECT_VERSION` for every uploaded build. Keep `MARKETING_VERSION` at the public semantic version, initially `1.0.0`.
2. In Xcode, select **Any iOS Device (arm64)** as the destination.
3. Choose **Product → Archive**.
4. In Organizer, run **Validate App** and resolve every signing, privacy, icon, and metadata warning.
5. Upload the validated archive to App Store Connect for internal TestFlight testing.
6. Complete Apple’s privacy, age-rating, export-compliance, support, description, screenshot, and review metadata honestly.
7. Test the exact TestFlight build on supported physical devices before requesting App Review.

Do not call an iOS build released, stable, or App Store available until the signed archive and public distribution record actually exist. Keep signing certificates, private keys, App Store Connect API keys, provisioning material, and account credentials outside this repository and maintain protected backups through Apple’s supported tooling.
