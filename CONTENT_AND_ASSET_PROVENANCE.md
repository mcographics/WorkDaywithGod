# Content, Asset, and Development Provenance

Last reviewed: 2026-08-04

Applies to: every published Work Day with God release through Windows 1.4.3, Linux 1.2.2 testing preview, and Android 1.0.0

## Purpose and scope

This document records how the content, visual assets, branding, and application code in Work Day with God were created or obtained. It is intended to make the project's use of original, AI-assisted, historical, and third-party material transparent.

This record reflects the project owner's account of the creation process together with the evidence currently preserved in the repository. It is not a transfer of rights, a warranty that every historical work is public domain in every country, or a substitute for release-specific legal review.

The word "free" in the README describes the price charged to users of the official application. It does not mean that the application, its source code, or every bundled component is in the public domain.

## Release scope and evidence boundaries

Work Day with God has separate public release lines for Windows, the Linux testing preview, and Android. A Git tag identifies a source snapshot; a GitHub release identifies the public distribution record and its downloadable assets. A local file under `release` is not treated as publicly distributed unless it is also present on the corresponding GitHub release.

The tables below were reconciled with the public GitHub release and asset metadata on 2026-08-04. Dates are GitHub publication dates in UTC. Commit links resolve annotated tags to their underlying source commits rather than to the tag objects themselves.

### Published release ledger

| Release | Public date | Platform and status | Source commit | Public artifact set | Provenance-impact summary |
| --- | --- | --- | --- | --- | --- |
| [`v1.0.0`](https://github.com/mcographics/WorkDaywithGod/releases/tag/v1.0.0) | 2026-07-31 | Windows x64; stable | [`076f0ee`](https://github.com/mcographics/WorkDaywithGod/commit/076f0ee4f407e10f23b5bde32e8aa039fb8c5797) | NSIS installer | First public application, devotional catalogue, nine Scripture libraries, branding, and original scenic collection. |
| [`v1.1.0`](https://github.com/mcographics/WorkDaywithGod/releases/tag/v1.1.0) | 2026-07-31 | Windows x64; stable | [`2a1502c`](https://github.com/mcographics/WorkDaywithGod/commit/2a1502c868281be71264e27f0b5bc2d296149281) | NSIS installer | Replaced the initial subdued scenes with the brighter 366-image processed library and expanded interface features. |
| [`v1.1.1`](https://github.com/mcographics/WorkDaywithGod/releases/tag/v1.1.1) | 2026-07-31 | Windows x64; stable | [`fdde84f`](https://github.com/mcographics/WorkDaywithGod/commit/fdde84f4d637fcd92e5b6e9a06d2e73c2b6dfccd) | NSIS installer | Established publisher-specific Windows identity and deterministic icon generation from `icon.png`. |
| [`v1.2.0`](https://github.com/mcographics/WorkDaywithGod/releases/tag/v1.2.0) | 2026-07-31 | Windows x64; stable | [`7334f2a`](https://github.com/mcographics/WorkDaywithGod/commit/7334f2a8f1273a812a10ed42158b835eedd55754) | NSIS installer | Added About, author, free-use, licensing, and promotional-artwork documentation. |
| [`v1.2.1`](https://github.com/mcographics/WorkDaywithGod/releases/tag/v1.2.1) | 2026-08-01 | Windows x64; stable | [`26073c6`](https://github.com/mcographics/WorkDaywithGod/commit/26073c6d865cb0d8eab6eb4620fc44be6a445d77) | NSIS installer | Security-hardening release; no recorded replacement of the devotional, Scripture, scene, or branding source sets. |
| [`v1.2.2-linux-beta.1`](https://github.com/mcographics/WorkDaywithGod/releases/tag/v1.2.2-linux-beta.1) | 2026-08-02 | Linux x64; testing prerelease | [`3607e4d`](https://github.com/mcographics/WorkDaywithGod/commit/3607e4daf77bcb543ca2ee7e435f0bace87d9b09) | AppImage, DEB, and RPM | First and currently only Linux package set; unsigned and preserved on [`linux-v1.2.2-testing`](https://github.com/mcographics/WorkDaywithGod/tree/linux-v1.2.2-testing). |
| [`v1.2.2`](https://github.com/mcographics/WorkDaywithGod/releases/tag/v1.2.2) | 2026-08-02 | Windows x64; stable | [`3607e4d`](https://github.com/mcographics/WorkDaywithGod/commit/3607e4daf77bcb543ca2ee7e435f0bace87d9b09) | NSIS installer | Navigation and completion-state fixes; shares its source commit with the Linux testing preview. |
| [`v1.3.0`](https://github.com/mcographics/WorkDaywithGod/releases/tag/v1.3.0) | 2026-08-02 | Windows x64; stable | [`9751e3a`](https://github.com/mcographics/WorkDaywithGod/commit/9751e3acf8bac42e2a78fc1cde4df95d98203018) | NSIS installer, blockmap, and `latest.yml` | Rebuilt all 366 devotionals around the explicitly Christ-centred, encouraging pastoral policy described below. |
| [`v1.4.0`](https://github.com/mcographics/WorkDaywithGod/releases/tag/v1.4.0) | 2026-08-02 | Windows x64; stable | [`31c4e75`](https://github.com/mcographics/WorkDaywithGod/commit/31c4e750b43b7a0d19b1c5cf2755cacf5899c372) | NSIS installer, blockmap, and `latest.yml` | Added local solar appearance, reminder safeguards, and navigation transitions without a recorded content-source replacement. |
| [`v1.4.1`](https://github.com/mcographics/WorkDaywithGod/releases/tag/v1.4.1) | 2026-08-02 | Windows x64; stable | [`1bb2774`](https://github.com/mcographics/WorkDaywithGod/commit/1bb2774626ec09af8cb8617500a79920cb856235) | NSIS installer, blockmap, and `latest.yml` | Corrected taskbar icon binding; underlying brand-art origin remained unchanged. |
| [`v1.4.1a`](https://github.com/mcographics/WorkDaywithGod/releases/tag/v1.4.1a) | 2026-08-03 | Windows x64; stable hotfix | [`a340766`](https://github.com/mcographics/WorkDaywithGod/commit/a340766b3ebed5917fe9927bf5ee5a815c9d95a7) | NSIS installer, blockmap, and `latest.yml` | Added a fresh Windows shell identity and standalone taskbar icon variant derived from project branding. |
| [`v1.4.2`](https://github.com/mcographics/WorkDaywithGod/releases/tag/v1.4.2) | 2026-08-03 | Windows x64; stable | [`44f30b6`](https://github.com/mcographics/WorkDaywithGod/commit/44f30b6f8c7e87434335e08c5b32d908e84aa343) | NSIS installer, blockmap, and `latest.yml` | Added device-local GitHub release checks; no remote runtime code or content delivery was added. |
| [`v1.4.3`](https://github.com/mcographics/WorkDaywithGod/releases/tag/v1.4.3) | 2026-08-03 | Windows x64; stable and current | [`a54dab6`](https://github.com/mcographics/WorkDaywithGod/commit/a54dab68251a7c03ecc8ee83593f66bf51f7aa95) | NSIS installer, blockmap, and `latest.yml` | Assigned distinct packaged and development AppUserModelIDs so development Electron identity cannot replace installed branding. |
| [`android-v1.0.0`](https://github.com/mcographics/WorkDaywithGod/releases/tag/android-v1.0.0) | 2026-08-04 | Android 7.0+; stable direct APK | [`75992f3`](https://github.com/mcographics/WorkDaywithGod/commit/75992f31a8fddff636603fe4e0ec4d3db3de99ef) | Signed APK and SHA-256 sidecar | First Android edition; reuses the current static content and scenes, adds native Capacitor code, mobile layouts, derived Android branding, and a dedicated signing identity. Source is preserved on [`android-v1.0.0`](https://github.com/mcographics/WorkDaywithGod/tree/android-v1.0.0). |

Only `v1.2.2-linux-beta.1` is marked as a prerelease. The Android release is intentionally separate from the Windows semantic-version tags and does not replace Windows 1.4.3 as the repository's Latest release.

### Primary distributable SHA-256 record

These are the GitHub-recorded SHA-256 digests for the user-installable artifacts. Beginning with Windows 1.3.0, the Windows releases also contain an Electron updater blockmap and `latest.yml`; those secondary asset digests remain available through the GitHub release API and are not repeated here.

| Release | Primary distributable | SHA-256 |
| --- | --- | --- |
| `v1.0.0` | `Work-Day-with-God-Setup-1.0.0.exe` | `15D802CF0F78FACAB5B78F65EE625A22BBD556460A0CAFC445A9AF251ACD7467` |
| `v1.1.0` | `Work-Day-with-God-Setup-1.1.0.exe` | `713226A68B9ED5BC6C18A43FD45714FE87FACA0726ACA99AC8C7C33CF4B34965` |
| `v1.1.1` | `Work-Day-with-God-Setup-1.1.1.exe` | `6F5DEA9DDF7BFFB2254AEDE9A4558FCE5A92BDE2AD4A9F7E7C3B7D42E27CB8B7` |
| `v1.2.0` | `Work-Day-with-God-Setup-1.2.0.exe` | `65EEDA7CCE57F2AD441E341B98F3631AB251403B7B51D29F6264E571A24E92CD` |
| `v1.2.1` | `Work-Day-with-God-Setup-1.2.1.exe` | `3D2DE8BEAA77E4D8B80B468485EC7BE8D23472C0CCDE7B57DFFCF766EDBEE7A5` |
| `v1.2.2-linux-beta.1` | `Work-Day-with-God-1.2.2-linux-x86_64.AppImage` | `A4BEF4994A013B5CEB3AB2EC51B04CB9F0775FC972E78456FABBB98FC77D767D` |
| `v1.2.2-linux-beta.1` | `Work-Day-with-God-1.2.2-linux-amd64.deb` | `44039971DE33EBD80B8DACAD5ECD1723A34124996E622B8D8FCE037BFCF4C618` |
| `v1.2.2-linux-beta.1` | `Work-Day-with-God-1.2.2-linux-x86_64.rpm` | `9C398586CDFFD8CEA26E2694B20569AD897CB1B782940CFB198A91018DB7B297` |
| `v1.2.2` | `Work-Day-with-God-Setup-1.2.2.exe` | `18099AC6C35CEBD575A5841795D37C7D76037DE222B4D0E9C786A85BF4A67A69` |
| `v1.3.0` | `Work-Day-with-God-Setup-1.3.0.exe` | `7DA79DFE1D4AD98559EB1571E3D9830451BB2AD3DCEDD8289445BF6117080299` |
| `v1.4.0` | `Work-Day-with-God-Setup-1.4.0.exe` | `D1E69CB73332550D14C4D0ED38B51B22B21832892838DC6B24630360D8C27258` |
| `v1.4.1` | `Work-Day-with-God-Setup-1.4.1.exe` | `0AA55CE7DCB10AE616C97C6DE18A551BD9842F893D01BA242DB31DC799F004A4` |
| `v1.4.1a` | `Work-Day-with-God-Setup-1.4.1a.exe` | `494CC1BEE788D62C6D5539400A76024109799DD0A56AAE272DB9460AD34AAE85` |
| `v1.4.2` | `Work-Day-with-God-Setup-1.4.2.exe` | `86F42B628C290B7C94AF48A3F6FF52CCA4F8D4398006988D9DFF8BF663530E59` |
| `v1.4.3` | `Work-Day-with-God-Setup-1.4.3.exe` | `DCB11364E439FA5AB7D6BDC045FFB841D1965F13B5D5D3261F464D255FB10216` |
| `android-v1.0.0` | `Work-Day-with-God-Android-1.0.0.apk` | `C89BABA4652A553C2799F74F2C8335523DA54C868CD85725D792BB5836B16D84` |

Hashes prove byte identity for the release assets; they do not prove authorship, ownership, licence scope, safety, or legal clearance.

### Signing and distribution status

- **Windows:** The public artifacts are per-user NSIS installers distributed through GitHub. Windows 1.4.3 was directly verified as Authenticode `NotSigned`, so Windows may show SmartScreen or Unknown Publisher warnings. The GitHub release API does not preserve historical Authenticode verification output for every earlier installer; any claim requiring version-by-version signing evidence remains `review required` unless a separate archived signature report is produced.
- **Linux:** All three `v1.2.2-linux-beta.1` packages are unsigned x64 testing artifacts. Container installation and startup checks do not replace real-desktop testing or code signing.
- **Android:** `android-v1.0.0` is a production-signed APK distributed directly through GitHub rather than Google Play. Its application ID is `com.mcographics.workdaywithgod`, and its signing-certificate SHA-256 fingerprint is `30:89:FB:CF:57:20:E9:A8:B1:F1:8C:1F:93:48:0A:DE:99:F8:29:D1:E5:94:DB:18:0F:B1:D4:04:79:07:03:59`. The keystore, credentials, and signing-properties file are intentionally excluded from the repository and must remain protected for compatible updates.

## Project creation process

Work Day with God was conceived, directed, reviewed, and approved by Kenneth Salmon. The project was developed through an iterative collaboration with OpenAI's ChatGPT and Codex tools.

That collaboration included:

- brainstorming the application's purpose, features, wording, and user experience;
- drafting and revising source code, tests, build scripts, and documentation;
- developing devotional themes, reflections, questions, and prayers;
- developing visual concepts, image-generation directions, branding, and asset-processing workflows; and
- troubleshooting, testing, packaging, and release preparation.

The project owner supplied the goals and creative direction, made product and faith-based decisions, requested revisions, tested the application, and accepted the material included in each release. AI assistance is therefore part of the project's creation history and is disclosed here rather than presenting the project as solely hand-written or traditionally commissioned work.

The installed application does not generate content with AI, connect to an AI service, or send users' devotional activity to an AI provider. The distributed devotionals and visual assets are static local files.

## Provenance summary

| Material | Repository location | Origin and development method | Evidence retained | Current classification |
| --- | --- | --- | --- | --- |
| Application code and interface | `src`, `electron`, `android`, `scripts` | Created specifically for Work Day with God through owner-directed, AI-assisted development | Git history, platform-specific release tags and branches, source files, tests, and build configuration | Project material, excluding third-party dependencies |
| Devotional writing | `public/content/devotionals.json` | Original-to-project, AI-assisted drafts and reusable text components selected and approved by the project owner | Generation script and generated JSON | Project material; AI assistance disclosed |
| Daily Scripture quotations | `public/content/devotionals.json` | Selected from the bundled KJV cache | Reference, translation label, and source cache | Historical third-party Scripture text; not claimed as original project writing |
| Full-chapter Scripture libraries | `public/content/*.json` | Normalized from historical translation caches in `data/electron_cache` | Translation files and application allowlist | Per-translation and per-country rights verification still required |
| Daily scenic artwork | `public/scenes` | Built from a project-specific library of AI-generated scenic sources, then cropped, resized, colour-adjusted, and optimized | Output manifest, source filename mapping, byte sizes, and SHA-256 hashes | AI-generated and project-processed material |
| Branding and application icons | `icon.png`, `build/icon.*`, `android/app/src/main/res` | Developed specifically for Work Day with God through the same owner-directed, AI-assisted process; Android adaptive, splash, launcher, and notification variants were derived for the mobile release | Source image, deterministic desktop branding script, Android resources, and release history | Project branding; AI assistance disclosed |
| Software libraries and build tools | `package.json`, `package-lock.json` | Third-party open-source packages | Locked package names and versions | Governed by their respective licences |

"Project material" in this document identifies material developed specifically for this application. It does not assert exclusive copyright over public-domain text, third-party components, or purely AI-generated elements.

## Devotional content

The 366 daily entries in `public/content/devotionals.json` were developed specifically for Work Day with God. They were not deliberately copied or adapted from a third-party devotional book, website, sermon, or subscription service.

The detailed pastoral-selection and explicit Christ-centred policy described below applies to the catalogue introduced in Windows 1.3.0 and inherited by Windows 1.4.0 through 1.4.3 and Android 1.0.0. Windows 1.0.0 through 1.2.2 and the Linux 1.2.2 testing preview packaged an earlier devotional snapshot. Their tagged source trees remain the authoritative evidence for the exact text they distributed; the current catalogue description must not be retroactively treated as a verbatim description of those earlier packages.

The devotional system uses a project-specific set of themes, titles, openings, reflections, closing thoughts, practical questions, and prayers. `scripts/generate-content.cjs` selects KJV anchor passages from an intentionally pastoral source pool and deterministically assembles those components into calendar entries. The selector requires affirmative, encouraging language; rejects isolated passages centred on judgment, violence, condemnation, or distress; and keeps roughly three quarters of the daily anchors in the New Testament. Every assembled devotional explicitly points the reader to Jesus or Christ in its reflection, question, or prayer. The project owner guided the desired tone and subject matter and reviewed the resulting experience.

The attribution `Original reflection by Work Day with God` means that the non-Scripture reflection was produced for this project rather than reproduced from a named third-party devotional publication. It should not be interpreted as a claim that the text was created without AI assistance.

The quoted Bible verse and its reference remain Scripture material and are not included in the claim of original devotional authorship.

## Scripture translations

The application bundles the following nine historical translations for offline full-chapter reading:

| Application ID | Display name |
| --- | --- |
| `KJV` | King James Version |
| `ASV` | American Standard Version |
| `DBT` | Darby Bible Translation |
| `DRB` | Douay-Rheims Bible |
| `ERV` | English Revised Version |
| `JPS` | JPS 1917 |
| `WBT` | Webster Bible Translation |
| `YLT` | Young's Literal Translation |
| `GENEVA_BIBLE1560` | Geneva Bible 1560 |

The source repository contains other experimental translation caches, but the application allowlist in `src/scripture.js` and the generated files in `public/content` restrict the distributed reader to the translations above.

These Scripture texts are not represented as original Work Day with God writing. The repository currently preserves the normalized text caches, but it does not preserve a complete source URL, download date, edition record, or rights memorandum for every cache. Consequently, this document does not make a blanket claim that every digital file is public domain in every jurisdiction.

Before a release is treated as commercially cleared for a target country, the project owner should verify and retain, for each translation:

- the exact historical edition and electronic source;
- the rights status of both the underlying translation and the particular digital transcription;
- any attribution, notice, or redistribution conditions;
- whether editorial additions, formatting, or database rights apply; and
- the countries covered by the review.

Normalizing historical text into the application's JSON structure does not create ownership of the underlying Scripture translation.

## Scenic artwork

The 366 daily Verse Card scenes under `public/scenes` were created for Work Day with God from a project-specific scenic image library produced through the project's AI-assisted visual-development process. According to the project owner's creation record, the library was not assembled from downloaded stock-photo collections or copied third-party artwork.

Windows 1.0.0 contained the original subdued scenic collection. Windows 1.1.0 replaced it with the brighter 366-image processed library described below, which was then inherited by later Windows releases, the Linux 1.2.2 testing preview, and Android 1.0.0 unless a tagged source tree shows an individual asset change. The manifest in the current source tree describes the current output set and does not retroactively identify bytes shipped in Windows 1.0.0.

The Windows 1.1.0 changelog uses the phrase "local source photographs," while the project owner's creation record describes the scenic source library as AI-generated. Because the original generation sessions, model identifiers, and acquisition records are not preserved publicly, the exact origin evidence behind that historical wording remains `review required`. The changelog phrase should not be treated by itself as proof that the source files were camera photographs or third-party stock images.

The visual direction requested natural scenic imagery without people, readable text, logos, watermarks, buildings, or explicit religious symbols. The final application files were selected and processed locally into 1920 x 1080 WebP assets for offline use.

`scripts/build-scenes-from-library.cjs` records each final scene's project-local source filename, category, byte size, and SHA-256 hash in `public/scenes/manifest.json`. The hash identifies the exact output file and helps detect later changes; it does not, by itself, prove copyright ownership or licensing rights.

The original AI generation sessions, model identifiers, and dated provider-terms snapshots are not currently preserved in this public repository. Future source generation should retain that information in a private release-evidence archive when practical. Credentials, account tokens, and personal billing information must not be committed.

## Branding and interface

The Work Day with God name, application concept, interface direction, wording, colour choices, logo treatment, and icon were developed specifically for this project through owner-directed brainstorming and AI-assisted implementation.

`icon.png` is the source used by `scripts/generate-branding.cjs` to produce the installer and desktop icon formats. The generated `build/icon.png` and `build/icon.ico` files are format variants and do not have an independent origin.

Windows 1.1.1 established deterministic desktop icon generation and publisher-specific application identity. Windows 1.4.1, 1.4.1a, and 1.4.3 changed taskbar icon resources, relaunch metadata, and AppUserModelID behavior without changing the documented creative origin of the underlying Work Day with God brand. Android 1.0.0 added adaptive launcher icons, splash resources, a notification status icon, and other platform-specific raster variants under `android/app/src/main/res`; those are treated as derived project branding rather than unrelated third-party artwork.

This provenance statement is not a trademark clearance search and does not establish trademark registration.

## Application code and third-party software

The application-specific source code was produced through the collaborative process described above. It also relies on third-party open-source software. Those packages are not owned by Work Day with God and remain governed by their respective licences.

Dependency versions are release-specific. The `package-lock.json` stored at each release tag is the authoritative inventory for that source snapshot; the current lockfile must not be used to claim that an older installer contained identical transitive versions.

The current source snapshot, representing the Windows 1.4.3 code line plus Android 1.0.0 additions, records these direct mobile runtime packages:

| Package | Locked version | Licence reported by the installed package |
| --- | ---: | --- |
| `@capacitor/android` | 8.5.0 | MIT |
| `@capacitor/app` | 8.0.1 | MIT |
| `@capacitor/browser` | 8.0.4 | MIT |
| `@capacitor/core` | 8.5.0 | MIT |
| `@capacitor/filesystem` | 8.1.2 | MIT |
| `@capacitor/geolocation` | 8.2.0 | MIT |
| `@capacitor/local-notifications` | 8.2.1 | MIT |
| `@capacitor/preferences` | 8.0.1 | MIT |
| `@capacitor/share` | 8.0.1 | MIT |
| `@capacitor/status-bar` | 8.0.3 | MIT |

The same current snapshot records these direct development, desktop-runtime, and build packages:

| Package | Locked version | Licence reported by the installed package |
| --- | ---: | --- |
| `@capacitor/cli` | 8.5.0 | MIT |
| `@vitejs/plugin-react` | 4.7.0 | MIT |
| `concurrently` | 9.2.4 | MIT |
| `electron` | 43.2.0 | MIT |
| `lucide-react` | 0.511.0 | ISC |
| `react` | 19.2.8 | MIT |
| `react-dom` | 19.2.8 | MIT |
| `sharp` | 0.35.3 | Apache-2.0 |
| `vite` | 6.4.3 | MIT |
| `wait-on` | 8.0.5 | MIT |

The version and licence values above were reconciled against the installed package metadata and current lockfile on 2026-08-04. Package licence files and notices supplied with direct and transitive dependencies remain applicable. This summary does not replace those terms or an automated release-specific licence report.

## Release evidence and future review

The release ledger above records every GitHub release published through 2026-08-04, but it is not a substitute for retaining the tagged source tree, dependency lockfile, public release metadata, and private evidence that must not be committed. `CHANGELOG.md` remains the feature-level history; this document records provenance boundaries and distribution evidence.

For future public releases, this file should be reviewed when content sources, Scripture libraries, image-generation methods, branding, signing identity, platform scope, or direct dependencies change. A release evidence record should preserve, where applicable:

- the application version and review date;
- platform, release tag, source commit, stability status, and target architecture;
- public artifact names, byte sizes, SHA-256 digests, and download verification;
- code-signing or package-signing status and certificate fingerprint where applicable;
- original source URLs and acquisition dates;
- licence names and required attribution text;
- relevant provider terms or dated snapshots;
- source-to-output filenames and hashes;
- a dependency licence report; and
- any unresolved rights questions or geographic restrictions.

Material with an unknown source or unclear redistribution permission should be recorded as `review required` and replaced or cleared before it is represented as approved for commercial redistribution.

Questions about project permissions may be directed to `kenneth.salmon87@outlook.com`.
